export function isNonEmpty(value: string | undefined | null): boolean {
  return value !== undefined && value !== null && value.trim() !== "";
}

export function requireField(value: string | undefined | null, label: string): string | null {
  return isNonEmpty(value) ? null : `${label} is required.`;
}

export function collectErrors(...checks: (string | null)[]): string[] {
  return checks.filter((c): c is string => c !== null);
}
