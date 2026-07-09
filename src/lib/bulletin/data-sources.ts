export const DATA_SOURCE_OPTIONS = [
  "Surface observations",
  "Eumetsat",
  "NOAA",
  "Windy",
  "Ogimet",
  "ASECNA",
  "GFS model",
  "ECMWF model",
  "Other",
] as const;

export function parseDataSources(value: string): string[] {
  if (!value.trim()) return [];
  return value
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function serializeDataSources(sources: string[]): string {
  return sources.join("; ");
}
