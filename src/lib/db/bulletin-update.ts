import type pg from "pg";
import { HAZARDS, REGIONS } from "@/lib/bulletin/constants";
import { serializeStoredPrefectures } from "@/lib/bulletin/region-prefectures";
import type { BulletinData } from "@/lib/bulletin/types";
import { formatValidityPeriod } from "@/lib/bulletin/validity-period";
import { isNonEmpty } from "@/lib/validation/entities";
import { weatherInsertParams, weatherUpdateAssignments } from "@/lib/validation/weather-fields";

export type UpdatedBulletin = {
  bulletin_id: string;
  forecast_date: string;
};

export async function updateBulletin(
  client: pg.PoolClient,
  bulletinId: string,
  bulletin: BulletinData
): Promise<UpdatedBulletin> {
  const metadata = bulletin.metadata;
  const forecastDate = metadata.forecast_date;
  const publicationTime = metadata.publication_time;
  const validityPeriod = formatValidityPeriod(metadata);

  await client.query(
    `UPDATE weather_bulletin SET
       forecast_date = $2,
       publication_time = $3,
       validity_period = $4,
       data_sources = $5,
       national_forecast_text = $6,
       general_comment = $7,
       submission_status = $8,
       forecaster_name = $9,
       updated_at = NOW()
     WHERE bulletin_id = $1`,
    [
      bulletinId,
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

  await client.query(
    `UPDATE national_forecast SET
       forecast_date = $2,
       publication_time = $3,
       validity_period = $4,
       ${weatherUpdateAssignments(5)}
     WHERE bulletin_id = $1`,
    [
      bulletinId,
      forecastDate,
      publicationTime,
      validityPeriod,
      ...weatherInsertParams(bulletin.nationalForecast),
    ]
  );

  for (const region of REGIONS) {
    await client.query(
      `UPDATE region_forecast SET
         ${weatherUpdateAssignments(2)}
       WHERE bulletin_id = $1 AND region_code = $13`,
      [bulletinId, ...weatherInsertParams(bulletin.regionForecast[region]), region]
    );
  }

  for (const hazard of HAZARDS) {
    const entry = bulletin.nationalHazard[hazard];
    await client.query(
      `UPDATE national_hazard_risk SET
         forecast_date = $2,
         risk_level = $3,
         areas_concerned = $4,
         risk_comment = $5,
         possible_recommendations = $6
       WHERE bulletin_id = $1 AND hazard_type = $7`,
      [
        bulletinId,
        forecastDate,
        entry.risk_level,
        serializeStoredPrefectures(entry.affected_prefectures),
        isNonEmpty(entry.comment) ? entry.comment.trim() : null,
        isNonEmpty(entry.recommendations) ? entry.recommendations.trim() : null,
        hazard,
      ]
    );
  }

  for (const region of REGIONS) {
    for (const hazard of HAZARDS) {
      const entry = bulletin.regionHazard[region][hazard];
      await client.query(
        `UPDATE regional_hazard_risk SET
           risk_level = $3,
           affected_prefectures = $4,
           affected_subprefectures = $5,
           risk_comment = $6,
           possible_recommendations = $7
         WHERE bulletin_id = $1 AND region_code = $2 AND hazard_type = $8`,
        [
          bulletinId,
          region,
          entry.risk_level,
          entry.affected_prefectures.length > 0 ? entry.affected_prefectures : null,
          null,
          isNonEmpty(entry.comment) ? entry.comment.trim() : null,
          isNonEmpty(entry.recommendations) ? entry.recommendations.trim() : null,
          hazard,
        ]
      );
    }
  }

  const interpretation = bulletin.interpretation;
  await client.query(
    `UPDATE meteorological_interpretation SET
       general_situation = $2,
       expected_conditions = $3,
       risk_areas = $4,
       expected_evolution = $5,
       recommendations = $6,
       additional_notes = $7
     WHERE bulletin_id = $1`,
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
