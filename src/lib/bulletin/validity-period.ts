/**
 * Best-effort parser for free-text validity periods, e.g.
 * "From 2026-07-01 09:00 local time to 23:59 local time"
 * "Du 17/06/2026 à 09h00 locales à 23h59 locales"
 */

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

/** Returns true when end time is not later than start (parseable text only). */
export function isValidityPeriodEndBeforeStart(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const times = extractOrderedDateTimes(trimmed);
  if (times.length < 2) return false;

  const start = times[0];
  const end = times[times.length - 1];
  return end.getTime() <= start.getTime();
}
