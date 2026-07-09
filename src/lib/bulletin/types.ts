// Types mirror the Data_Dictionary / DB_Schema sheets in
// Conceptual_template_DGM_daily_weather_forecast_form_CAR_EN_regions_1.xlsx

export type RiskLevel = "None" | "Low" | "Moderate" | "High" | "Very High";
export type Hazard = "Heat wave" | "Flood" | "Strong wind" | "Dust";
export type WindDirection =
  | "North" | "North-East" | "East" | "South-East"
  | "South" | "South-West" | "West" | "North-West";
export type Confidence = "Low" | "Medium" | "High";
export type SubmissionStatus = "Draft" | "Submitted" | "Validated";
export type RegionCode = "R1" | "R2" | "R3" | "R4" | "R5" | "R6" | "R7";

export interface WeatherEntry {
  temp_min_c: string;
  temp_max_c: string;
  temp_ressentie_c: string;
  relative_humidity_pct: string;
  pressure_hpa: string;
  wind_direction: WindDirection | "";
  wind_speed_kmh: string;
  rainfall_mm: string;
  sunshine_pct: string;
  confidence: Confidence | "";
  comment: string;
}

export const emptyWeatherEntry = (): WeatherEntry => ({
  temp_min_c: "", temp_max_c: "", temp_ressentie_c: "", relative_humidity_pct: "",
  pressure_hpa: "", wind_direction: "", wind_speed_kmh: "", rainfall_mm: "",
  sunshine_pct: "", confidence: "", comment: "",
});

export interface NationalHazardEntry {
  risk_level: RiskLevel | "";
  affected_prefectures: string[];
  comment: string;
  recommendations: string;
}

export const emptyNationalHazardEntry = (): NationalHazardEntry => ({
  risk_level: "", affected_prefectures: [], comment: "", recommendations: "",
});

export interface RegionHazardEntry {
  risk_level: RiskLevel | "";
  // Conditional field per Data_Dictionary: required if risk_level !== "None".
  // Prefectures are constrained per region — see region-prefectures.ts.
  affected_prefectures: string[];
  comment: string;
  recommendations: string;
}

export const emptyRegionHazardEntry = (): RegionHazardEntry => ({
  risk_level: "", affected_prefectures: [], comment: "", recommendations: "",
});

export interface BulletinMetadata {
  forecast_date: string;
  publication_time: string;
  validity_date: string;
  validity_start_time: string;
  validity_end_time: string;
  data_sources: string;
  national_forecast_text: string;
  general_comment: string;
  submission_status: SubmissionStatus | "";
  forecaster_name: string;
}

export const emptyMetadata = (): BulletinMetadata => ({
  forecast_date: "", publication_time: "",
  validity_date: "", validity_start_time: "08:00", validity_end_time: "23:59",
  data_sources: "",
  national_forecast_text: "", general_comment: "", submission_status: "", forecaster_name: "",
});

export interface Interpretation {
  general_situation: string;
  expected_conditions: string;
  risk_areas: string;
  expected_evolution: string;
  recommendations: string;
  additional_notes: string;
}

export const emptyInterpretation = (): Interpretation => ({
  general_situation: "", expected_conditions: "", risk_areas: "",
  expected_evolution: "", recommendations: "", additional_notes: "",
});

export interface BulletinData {
  metadata: BulletinMetadata;
  nationalForecast: WeatherEntry;
  regionForecast: Record<RegionCode, WeatherEntry>;
  nationalHazard: Record<Hazard, NationalHazardEntry>;
  regionHazard: Record<RegionCode, Record<Hazard, RegionHazardEntry>>;
  interpretation: Interpretation;
}

export type WizardStep = 0 | 1 | 2 | 3 | 4 | 5;

export interface ValidationMessage {
  key: string;
  params?: Record<string, string | number>;
}

export interface ValidationResult {
  blocking: ValidationMessage[];
  warnings: ValidationMessage[];
  // field-level keys so the UI can highlight specific inputs, e.g. "region:R3:temp_max_c"
  fieldBlocking: Set<string>;
  fieldWarning: Set<string>;
  fieldBlockingMsg: Record<string, ValidationMessage>;
  fieldWarningMsg: Record<string, ValidationMessage>;
}
