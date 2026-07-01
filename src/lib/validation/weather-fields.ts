import { collectErrors, isNonEmpty, requireField } from "@/lib/validation/entities";

export type WeatherFieldInput = {
  temp_min_c: string;
  temp_max_c: string;
  temp_ressentie_c: string;
  relative_humidity_pct: string;
  pressure_hpa: string;
  wind_direction: string;
  wind_speed_kmh: string;
  rainfall_mm: string;
  sunshine_pct: string;
  confidence: string;
  comment: string;
};

export type BulletinContextInput = {
  forecast_date: string;
  publication_time: string;
  validity_period: string;
};

export function validateBulletinContext(input: BulletinContextInput): string[] {
  return collectErrors(
    requireField(input.forecast_date, "Forecast date"),
    requireField(input.publication_time, "Publication time"),
    requireField(input.validity_period, "Validity period")
  );
}

export function validateWeatherFields(
  input: WeatherFieldInput,
  label: string
): string[] {
  return collectErrors(
    requireField(input.temp_min_c, `${label}: minimum temperature`),
    requireField(input.temp_max_c, `${label}: maximum temperature`),
    requireField(input.temp_ressentie_c, `${label}: feels-like temperature`),
    requireField(input.relative_humidity_pct, `${label}: relative humidity`),
    requireField(input.wind_direction, `${label}: wind direction`),
    requireField(input.wind_speed_kmh, `${label}: wind speed`),
    requireField(input.rainfall_mm, `${label}: rainfall`)
  );
}

export function weatherInsertParams(input: WeatherFieldInput): unknown[] {
  return [
    isNonEmpty(input.temp_min_c) ? Number(input.temp_min_c) : null,
    isNonEmpty(input.temp_max_c) ? Number(input.temp_max_c) : null,
    isNonEmpty(input.temp_ressentie_c) ? Number(input.temp_ressentie_c) : null,
    isNonEmpty(input.relative_humidity_pct) ? Number(input.relative_humidity_pct) : null,
    isNonEmpty(input.pressure_hpa) ? Number(input.pressure_hpa) : null,
    isNonEmpty(input.wind_direction) ? input.wind_direction : null,
    isNonEmpty(input.wind_speed_kmh) ? Number(input.wind_speed_kmh) : null,
    isNonEmpty(input.rainfall_mm) ? Number(input.rainfall_mm) : null,
    isNonEmpty(input.sunshine_pct) ? Number(input.sunshine_pct) : null,
    isNonEmpty(input.confidence) ? input.confidence : null,
    isNonEmpty(input.comment) ? input.comment.trim() : null,
  ];
}

const WEATHER_DB_COLUMNS = [
  "temp_min_c",
  "temp_max_c",
  "temp_ressentie_c",
  "relative_humidity_pct",
  "pressure_hpa",
  "wind_direction",
  "wind_speed_kmh",
  "rainfall_mm",
  "sunshine_pct",
  "confidence_level",
  "comment",
] as const;

export function weatherUpdateAssignments(startIndex: number): string {
  return WEATHER_DB_COLUMNS.map(
    (column, index) => `${column} = $${startIndex + index}`
  ).join(",\n  ");
}

export function weatherInsertPlaceholderRange(
  startIndex: number,
  count = WEATHER_DB_COLUMNS.length
): string {
  return Array.from({ length: count }, (_, index) => `$${startIndex + index}`).join(", ");
}

export const WEATHER_SELECT = WEATHER_DB_COLUMNS.join(", ");

export const WEATHER_INSERT_COLUMNS = WEATHER_DB_COLUMNS.join(", ");

export const BULLETIN_CONTEXT_COLUMNS = "forecast_date, publication_time, validity_period";

export function bulletinContextParams(input: BulletinContextInput): unknown[] {
  return [input.forecast_date, input.publication_time, input.validity_period.trim()];
}

export function emptyWeatherFieldInput(): WeatherFieldInput {
  return {
    temp_min_c: "",
    temp_max_c: "",
    temp_ressentie_c: "",
    relative_humidity_pct: "",
    pressure_hpa: "",
    wind_direction: "",
    wind_speed_kmh: "",
    rainfall_mm: "",
    sunshine_pct: "",
    confidence: "",
    comment: "",
  };
}

export function rowToWeatherFieldInput(row: {
  temp_min_c?: string | number | null;
  temp_max_c?: string | number | null;
  temp_ressentie_c?: string | number | null;
  relative_humidity_pct?: string | number | null;
  pressure_hpa?: string | number | null;
  wind_direction?: string | null;
  wind_speed_kmh?: string | number | null;
  rainfall_mm?: string | number | null;
  sunshine_pct?: string | number | null;
  confidence_level?: string | null;
  confidence?: string | null;
  comment?: string | null;
}): WeatherFieldInput {
  return {
    temp_min_c: String(row.temp_min_c ?? ""),
    temp_max_c: String(row.temp_max_c ?? ""),
    temp_ressentie_c: String(row.temp_ressentie_c ?? ""),
    relative_humidity_pct: String(row.relative_humidity_pct ?? ""),
    pressure_hpa: String(row.pressure_hpa ?? ""),
    wind_direction: String(row.wind_direction ?? ""),
    wind_speed_kmh: String(row.wind_speed_kmh ?? ""),
    rainfall_mm: String(row.rainfall_mm ?? ""),
    sunshine_pct: String(row.sunshine_pct ?? ""),
    confidence: String(row.confidence_level ?? row.confidence ?? ""),
    comment: String(row.comment ?? ""),
  };
}

import { formatDateValue, formatTimeValue } from "@/lib/format/dates";

export function rowToBulletinContext(row: {
  forecast_date?: string | Date | null;
  publication_time?: string | Date | null;
  validity_period?: string | null;
}): BulletinContextInput {
  return {
    forecast_date: formatDateValue(row.forecast_date),
    publication_time: formatTimeValue(row.publication_time),
    validity_period: row.validity_period ?? "",
  };
}
