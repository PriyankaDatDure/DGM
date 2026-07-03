/**
 * Validity period helpers — structured date/start/end in the form,
 * canonical text in the DB (`YYYY-MM-DD HH:MM to HH:MM`).
 * Legacy free-text values are parsed on load when possible.
 */

export interface ValidityPeriodFields {
  validity_date: string;
  validity_start_time: string;
  validity_end_time: string;
}

function padTime(value: string): string {
  const [h, m] = value.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

function formatTimeISO(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${mi}`;
}

function parseIsoDateTime(text: string): Date | null {
  const match = text.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match;
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
}

function parseFrDate(text: string): { day: number; month: number; year: number } | null {
  const match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  return { day: Number(match[1]), month: Number(match[2]), year: Number(match[3]) };
}

function parseTime(text: string): { hour: number; minute: number } | null {
  const colon = text.match(/(\d{1,2}):(\d{2})/);
  if (colon) return { hour: Number(colon[1]), minute: Number(colon[2]) };
  const fr = text.match(/(\d{1,2})h(\d{2})/i);
  if (fr) return { hour: Number(fr[1]), minute: Number(fr[2]) };
  return null;
}

function combineDateAndTime(
  date: { day: number; month: number; year: number },
  time: { hour: number; minute: number }
): Date {
  return new Date(date.year, date.month - 1, date.day, time.hour, time.minute);
}

function extractOrderedDateTimes(text: string): Date[] {
  const results: Date[] = [];

  for (const match of text.matchAll(/(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/g)) {
    results.push(
      new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        Number(match[4]),
        Number(match[5])
      )
    );
  }
  if (results.length >= 2) return results;

  const frDate = parseFrDate(text);
  const times = [...text.matchAll(/(\d{1,2})h(\d{2})/gi)].map((m) => ({
    hour: Number(m[1]),
    minute: Number(m[2]),
  }));
  if (frDate && times.length >= 2) {
    return times.map((t) => combineDateAndTime(frDate, t));
  }

  const colonTimes = [...text.matchAll(/(\d{1,2}):(\d{2})/g)].map((m) => ({
    hour: Number(m[1]),
    minute: Number(m[2]),
  }));
  const isoDate = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate && colonTimes.length >= 2) {
    const base = {
      day: Number(isoDate[3]),
      month: Number(isoDate[2]),
      year: Number(isoDate[1]),
    };
    return colonTimes.map((t) => combineDateAndTime(base, t));
  }

  const parts = text.split(/\s+(?:to|à)\s+/i);
  if (parts.length === 2) {
    const start = parseIsoDateTime(parts[0]) ?? parseSegmentDateTime(parts[0]);
    const end = parseIsoDateTime(parts[1]) ?? parseSegmentDateTime(parts[1], start ?? undefined);
    if (start && end) return [start, end];
  }

  return results;
}

function parseSegmentDateTime(segment: string, reference?: Date): Date | null {
  const iso = parseIsoDateTime(segment);
  if (iso) return iso;

  const time = parseTime(segment);
  if (time && reference) {
    return new Date(
      reference.getFullYear(),
      reference.getMonth(),
      reference.getDate(),
      time.hour,
      time.minute
    );
  }

  const frDate = parseFrDate(segment);
  if (frDate && time) return combineDateAndTime(frDate, time);

  return null;
}

const emptyFields = (): ValidityPeriodFields => ({
  validity_date: "",
  validity_start_time: "",
  validity_end_time: "",
});

/** Serialize structured fields for DB storage. */
export function formatValidityPeriod(fields: ValidityPeriodFields): string {
  const date = fields.validity_date.trim();
  const start = fields.validity_start_time.trim();
  const end = fields.validity_end_time.trim();
  if (!date || !start || !end) return "";
  return `${date} ${padTime(start)} to ${padTime(end)}`;
}

/** Parse stored text into structured fields (canonical or legacy free-text). */
export function parseValidityPeriod(text: string): ValidityPeriodFields {
  const trimmed = text.trim();
  if (!trimmed) return emptyFields();

  const canonical = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s+to\s+(\d{1,2}:\d{2})$/i);
  if (canonical) {
    return {
      validity_date: canonical[1],
      validity_start_time: padTime(canonical[2]),
      validity_end_time: padTime(canonical[3]),
    };
  }

  const times = extractOrderedDateTimes(trimmed);
  if (times.length >= 2) {
    const start = times[0];
    const end = times[times.length - 1];
    return {
      validity_date: formatDateISO(start),
      validity_start_time: formatTimeISO(start),
      validity_end_time: formatTimeISO(end),
    };
  }

  return emptyFields();
}

/** Returns true when end time is not later than start on the same date. */
export function isStructuredValidityEndBeforeStart(
  date: string,
  startTime: string,
  endTime: string
): boolean {
  if (!date.trim() || !startTime.trim() || !endTime.trim()) return false;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return false;
  return eh * 60 + em <= sh * 60 + sm;
}

/** Returns true when end time is not later than start (parseable text only). */
export function isValidityPeriodEndBeforeStart(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const fields = parseValidityPeriod(trimmed);
  if (fields.validity_date && fields.validity_start_time && fields.validity_end_time) {
    return isStructuredValidityEndBeforeStart(
      fields.validity_date,
      fields.validity_start_time,
      fields.validity_end_time
    );
  }

  const times = extractOrderedDateTimes(trimmed);
  if (times.length < 2) return false;

  const start = times[0];
  const end = times[times.length - 1];
  return end.getTime() <= start.getTime();
}
