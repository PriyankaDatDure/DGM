import type pg from "pg";
import { HAZARDS, REGIONS } from "@/lib/bulletin/constants";
import type { BulletinData } from "@/lib/bulletin/types";
import { isNonEmpty } from "@/lib/validation/entities";
import { weatherInsertParams } from "@/lib/validation/weather-fields";

export type PersistedBulletin = {
  bulletin_id: string;
  forecast_date: string;
};

export async function persistBulletin(
  client: pg.PoolClient,
  bulletin: BulletinData
): Promise<PersistedBulletin> {
  const metadata = bulletin.metadata;
  const forecastDate = metadata.forecast_date;
  const publicationTime = metadata.publication_time;
  const validityPeriod = metadata.validity_period.trim();

  const bulletinResult = await client.query<{ bulletin_id: string; forecast_date: string }>(
    `INSERT INTO weather_bulletin (
       forecast_date, publication_time, validity_period, data_sources,
       national_forecast_text, general_comment, submission_status, forecaster_name
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING bulletin_id, forecast_date`,
    [
      forecastDate,
      publicationTime,
      validityPeriod,
      metadata.data_sources.trim(),
      metadata.national_forecast_text.trim(),
      isNonEmpty(metadata.general_comment) ? metadata.general_comment.trim() : null,
      metadata.submission_status,
      metadata.forecaster_name.trim(),
    ]
  );

  const { bulletin_id: bulletinId } = bulletinResult.rows[0];

  await client.query(
    `INSERT INTO national_forecast (
       bulletin_id, forecast_date, publication_time, validity_period,
       temp_min_c, temp_max_c, temp_ressentie_c, relative_humidity_pct,
       pressure_hpa, wind_direction, wind_speed_kmh, rainfall_mm,
       sunshine_pct, confidence_level, comment
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [bulletinId, forecastDate, publicationTime, validityPeriod, ...weatherInsertParams(bulletin.nationalForecast)]
  );

  for (const region of REGIONS) {
    await client.query(
      `INSERT INTO region_forecast (
         bulletin_id, region_code,
         temp_min_c, temp_max_c, temp_ressentie_c, relative_humidity_pct,
         pressure_hpa, wind_direction, wind_speed_kmh, rainfall_mm,
         sunshine_pct, confidence_level, comment
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [bulletinId, region, ...weatherInsertParams(bulletin.regionForecast[region])]
    );
  }

  for (const hazard of HAZARDS) {
    const entry = bulletin.nationalHazard[hazard];
    await client.query(
      `INSERT INTO national_hazard_risk (
         bulletin_id, forecast_date, hazard_type, risk_level, areas_concerned,
         risk_comment, possible_recommendations
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        bulletinId,
        forecastDate,
        hazard,
        entry.risk_level,
        isNonEmpty(entry.areas_concerned) ? entry.areas_concerned.trim() : null,
        isNonEmpty(entry.comment) ? entry.comment.trim() : null,
        isNonEmpty(entry.recommendations) ? entry.recommendations.trim() : null,
      ]
    );
  }

  for (const region of REGIONS) {
    for (const hazard of HAZARDS) {
      const entry = bulletin.regionHazard[region][hazard];
      await client.query(
        `INSERT INTO regional_hazard_risk (
           bulletin_id, region_code, hazard_type, risk_level,
           affected_prefectures, affected_subprefectures, risk_comment, possible_recommendations
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          bulletinId,
          region,
          hazard,
          entry.risk_level,
          entry.affected_prefectures.length > 0 ? entry.affected_prefectures : null,
          null,
          isNonEmpty(entry.comment) ? entry.comment.trim() : null,
          isNonEmpty(entry.recommendations) ? entry.recommendations.trim() : null,
        ]
      );
    }
  }

  const interpretation = bulletin.interpretation;
  await client.query(
    `INSERT INTO meteorological_interpretation (
       bulletin_id, general_situation, expected_conditions, risk_areas,
       expected_evolution, recommendations, additional_notes
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      bulletinId,
      interpretation.general_situation.trim(),
      isNonEmpty(interpretation.expected_conditions)
        ? interpretation.expected_conditions.trim()
        : null,
      isNonEmpty(interpretation.risk_areas) ? interpretation.risk_areas.trim() : null,
      isNonEmpty(interpretation.expected_evolution)
        ? interpretation.expected_evolution.trim()
        : null,
      isNonEmpty(interpretation.recommendations)
        ? interpretation.recommendations.trim()
        : null,
      isNonEmpty(interpretation.additional_notes)
        ? interpretation.additional_notes.trim()
        : null,
    ]
  );

  return { bulletin_id: bulletinId, forecast_date: forecastDate };
}
