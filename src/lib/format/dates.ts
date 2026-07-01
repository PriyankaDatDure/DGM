/** PostgreSQL via `pg` may return DATE/TIMESTAMP as Date objects, not strings. */
export function formatDateValue(value: string | Date | null | undefined): string {
  if (value == null) return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    // Use local calendar date — toISOString() shifts DATE values in many timezones.
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  if (typeof value === "string") {
    // YYYY-MM-DD or ISO timestamp — take the date portion only.
    return value.slice(0, 10);
  }
  return String(value).slice(0, 10);
}

export function formatTimeValue(value: string | Date | null | undefined): string {
  if (value == null) return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }
  if (typeof value === "string") return value.slice(0, 8).slice(0, 5);
  return String(value).slice(0, 5);
}

export function formatDateDisplay(value: string | Date | null | undefined): string {
  const formatted = formatDateValue(value);
  return formatted || "—";
}
