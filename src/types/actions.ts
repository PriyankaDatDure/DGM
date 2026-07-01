export type ActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

export type BulletinContextInput = {
  forecast_date: string;
  publication_time: string;
  validity_period: string;
};

export type WeatherBulletinInput = BulletinContextInput & {
  data_sources: string;
  national_forecast_text: string;
  general_comment: string;
  submission_status: string;
  forecaster_name: string;
};

export type WeatherFieldFormInput = {
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

export type NationalForecastInput = {
  bulletin_id: string;
  forecast_date: string;
  publication_time: string;
  validity_period: string;
} & WeatherFieldFormInput;

export type RegionForecastInput = {
  bulletin_id: string;
  region_code: string;
} & WeatherFieldFormInput;

export type NationalHazardRiskInput = {
  bulletin_id: string;
  forecast_date: string;
  hazard_type: string;
  risk_level: string;
  areas_concerned: string;
  risk_comment: string;
  possible_recommendations: string;
};

export type RegionalHazardRiskInput = {
  bulletin_id: string;
  region_code: string;
  hazard_type: string;
  risk_level: string;
  affected_prefectures: string;
  affected_subprefectures: string;
  risk_comment: string;
  possible_recommendations: string;
};

export type MeteorologicalInterpretationInput = {
  bulletin_id: string;
  general_situation: string;
  expected_conditions: string;
  risk_areas: string;
  expected_evolution: string;
  recommendations: string;
  additional_notes: string;
};
