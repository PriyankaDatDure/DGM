export interface WeatherBulletinRow {
  bulletin_id: string;
  forecast_date: string;
  publication_time: string | null;
  validity_period: string | null;
  data_sources: string | null;
  national_forecast_text: string | null;
  general_comment: string | null;
  submission_status: string | null;
  forecaster_name: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface NationalForecastRow {
  national_forecast_id: number;
  bulletin_id: string;
  forecast_date: string;
  publication_time: string | null;
  validity_period: string | null;
  temp_min_c: string | null;
  temp_max_c: string | null;
  temp_ressentie_c: string | null;
  relative_humidity_pct: string | null;
  pressure_hpa: string | null;
  wind_direction: string | null;
  wind_speed_kmh: string | null;
  rainfall_mm: string | null;
  sunshine_pct: string | null;
  confidence_level: string | null;
  comment: string | null;
}

export interface RegionForecastRow {
  region_forecast_id: number;
  bulletin_id: string;
  region_code: string;
  temp_min_c: string | null;
  temp_max_c: string | null;
  temp_ressentie_c: string | null;
  relative_humidity_pct: string | null;
  pressure_hpa: string | null;
  wind_direction: string | null;
  wind_speed_kmh: string | null;
  rainfall_mm: string | null;
  sunshine_pct: string | null;
  confidence_level: string | null;
  comment: string | null;
}

export interface NationalHazardRiskRow {
  national_hazard_risk_id: number;
  bulletin_id: string;
  forecast_date: string;
  hazard_type: string;
  risk_level: string | null;
  areas_concerned: string | null;
  risk_comment: string | null;
  possible_recommendations: string | null;
}

export interface RegionalHazardRiskRow {
  regional_hazard_risk_id: number;
  bulletin_id: string;
  region_code: string;
  hazard_type: string;
  risk_level: string | null;
  affected_prefectures: string[] | null;
  affected_subprefectures: string[] | null;
  risk_comment: string | null;
  possible_recommendations: string | null;
}

export interface MeteorologicalInterpretationRow {
  interpretation_id: number;
  bulletin_id: string;
  general_situation: string | null;
  expected_conditions: string | null;
  risk_areas: string | null;
  expected_evolution: string | null;
  recommendations: string | null;
  additional_notes: string | null;
}

export interface WeatherBulletinOption {
  bulletin_id: string;
  forecast_date: string;
  forecaster_name: string | null;
}
