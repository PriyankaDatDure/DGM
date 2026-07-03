import { query } from "@/lib/db";
import { HAZARDS, REGIONS } from "@/lib/bulletin/constants";
import type {
  BulletinData,
  Confidence,
  Hazard,
  RegionCode,
  RiskLevel,
  SubmissionStatus,
  WindDirection,
} from "@/lib/bulletin/types";
import {
  emptyInterpretation,
  emptyMetadata,
  emptyNationalHazardEntry,
  emptyRegionHazardEntry,
  emptyWeatherEntry,
} from "@/lib/bulletin/types";
import { formatDateValue, formatTimeValue } from "@/lib/format/dates";
import { parseValidityPeriod } from "@/lib/bulletin/validity-period";
import { rowToWeatherFieldInput } from "@/lib/validation/weather-fields";

function dbRowToWeatherEntry(row: Parameters<typeof rowToWeatherFieldInput>[0]) {
  const fields = rowToWeatherFieldInput(row);
  return {
    ...fields,
    wind_direction: fields.wind_direction as WindDirection | "",
    confidence: fields.confidence as Confidence | "",
  };
}

export async function loadBulletinById(bulletinId: string): Promise<BulletinData | null> {
  const bulletinResult = await query(
    `SELECT forecast_date, publication_time, validity_period, data_sources,
            national_forecast_text, general_comment, submission_status, forecaster_name
     FROM weather_bulletin WHERE bulletin_id = $1`,
    [bulletinId]
  );
  if (bulletinResult.rows.length === 0) return null;

  const bulletin = bulletinResult.rows[0];
  const validity = parseValidityPeriod(bulletin.validity_period ?? "");
  const metadata = {
    ...emptyMetadata(),
    forecast_date: formatDateValue(bulletin.forecast_date),
    publication_time: formatTimeValue(bulletin.publication_time),
    ...validity,
    data_sources: bulletin.data_sources ?? "",
    national_forecast_text: bulletin.national_forecast_text ?? "",
    general_comment: bulletin.general_comment ?? "",
    submission_status: (bulletin.submission_status ?? "") as SubmissionStatus | "",
    forecaster_name: bulletin.forecaster_name ?? "",
  };

  const nationalResult = await query(
    `SELECT temp_min_c, temp_max_c, temp_ressentie_c, relative_humidity_pct,
            pressure_hpa, wind_direction, wind_speed_kmh, rainfall_mm,
            sunshine_pct, confidence_level, comment
     FROM national_forecast WHERE bulletin_id = $1 LIMIT 1`,
    [bulletinId]
  );
  const nationalForecast = nationalResult.rows[0]
    ? dbRowToWeatherEntry(nationalResult.rows[0])
    : emptyWeatherEntry();

  const regionForecast = {} as BulletinData["regionForecast"];
  REGIONS.forEach((region) => {
    regionForecast[region] = emptyWeatherEntry();
  });
  const regionResult = await query(
    `SELECT region_code, temp_min_c, temp_max_c, temp_ressentie_c, relative_humidity_pct,
            pressure_hpa, wind_direction, wind_speed_kmh, rainfall_mm,
            sunshine_pct, confidence_level, comment
     FROM region_forecast WHERE bulletin_id = $1`,
    [bulletinId]
  );
  for (const row of regionResult.rows) {
    const code = row.region_code as RegionCode;
    if (REGIONS.includes(code)) {
      regionForecast[code] = dbRowToWeatherEntry(row);
    }
  }

  const nationalHazard = {} as BulletinData["nationalHazard"];
  HAZARDS.forEach((hazard) => {
    nationalHazard[hazard] = emptyNationalHazardEntry();
  });
  const nationalHazardResult = await query(
    `SELECT hazard_type, risk_level, areas_concerned, risk_comment, possible_recommendations
     FROM national_hazard_risk WHERE bulletin_id = $1`,
    [bulletinId]
  );
  for (const row of nationalHazardResult.rows) {
    const hazard = row.hazard_type as Hazard;
    if (HAZARDS.includes(hazard)) {
      nationalHazard[hazard] = {
        risk_level: (row.risk_level ?? "") as RiskLevel | "",
        areas_concerned: row.areas_concerned ?? "",
        comment: row.risk_comment ?? "",
        recommendations: row.possible_recommendations ?? "",
      };
    }
  }

  const regionHazard = {} as BulletinData["regionHazard"];
  REGIONS.forEach((region) => {
    regionHazard[region] = {} as Record<Hazard, ReturnType<typeof emptyRegionHazardEntry>>;
    HAZARDS.forEach((hazard) => {
      regionHazard[region][hazard] = emptyRegionHazardEntry();
    });
  });
  const regionHazardResult = await query(
    `SELECT region_code, hazard_type, risk_level, affected_prefectures,
            affected_subprefectures, risk_comment, possible_recommendations
     FROM regional_hazard_risk WHERE bulletin_id = $1`,
    [bulletinId]
  );
  for (const row of regionHazardResult.rows) {
    const region = row.region_code as RegionCode;
    const hazard = row.hazard_type as Hazard;
    if (REGIONS.includes(region) && HAZARDS.includes(hazard)) {
      regionHazard[region][hazard] = {
        risk_level: (row.risk_level ?? "") as RiskLevel | "",
        affected_prefectures: row.affected_prefectures ?? [],
        comment: row.risk_comment ?? "",
        recommendations: row.possible_recommendations ?? "",
      };
    }
  }

  const interpretationResult = await query(
    `SELECT general_situation, expected_conditions, risk_areas,
            expected_evolution, recommendations, additional_notes
     FROM meteorological_interpretation WHERE bulletin_id = $1 LIMIT 1`,
    [bulletinId]
  );
  const interpretation = interpretationResult.rows[0]
    ? {
        ...emptyInterpretation(),
        general_situation: interpretationResult.rows[0].general_situation ?? "",
        expected_conditions: interpretationResult.rows[0].expected_conditions ?? "",
        risk_areas: interpretationResult.rows[0].risk_areas ?? "",
        expected_evolution: interpretationResult.rows[0].expected_evolution ?? "",
        recommendations: interpretationResult.rows[0].recommendations ?? "",
        additional_notes: interpretationResult.rows[0].additional_notes ?? "",
      }
    : emptyInterpretation();

  return {
    metadata,
    nationalForecast,
    regionForecast,
    nationalHazard,
    regionHazard,
    interpretation,
  };
}