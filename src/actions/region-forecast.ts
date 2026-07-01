"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { formatDbError } from "@/lib/db/errors";
import { collectErrors, requireField } from "@/lib/validation/entities";
import {
  validateWeatherFields,
  weatherInsertParams,
  weatherInsertPlaceholderRange,
  weatherUpdateAssignments,
  WEATHER_INSERT_COLUMNS,
  WEATHER_SELECT,
} from "@/lib/validation/weather-fields";
import type { ActionResult, RegionForecastInput } from "@/types/actions";
import type { RegionForecastRow } from "@/types/database";

const ADMIN_PATH = "/admin/region-forecasts";

function validate(input: RegionForecastInput): string[] {
  return collectErrors(
    requireField(input.bulletin_id, "Bulletin ID"),
    requireField(input.region_code, "Region code"),
    ...validateWeatherFields(input, `Region ${input.region_code}`)
  );
}

export async function listRegionForecasts(): Promise<ActionResult<RegionForecastRow[]>> {
  try {
    const result = await query<RegionForecastRow>(
      `SELECT region_forecast_id, bulletin_id, region_code, ${WEATHER_SELECT}
       FROM region_forecast ORDER BY region_forecast_id DESC`
    );
    return { success: true, data: result.rows };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function getRegionForecast(id: number): Promise<ActionResult<RegionForecastRow>> {
  try {
    const result = await query<RegionForecastRow>(
      `SELECT region_forecast_id, bulletin_id, region_code, ${WEATHER_SELECT}
       FROM region_forecast WHERE region_forecast_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return { success: false, error: "Region forecast not found." };
    }
    return { success: true, data: result.rows[0] };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function createRegionForecast(
  input: RegionForecastInput
): Promise<ActionResult<RegionForecastRow>> {
  const errors = validate(input);
  if (errors.length > 0) return { success: false, error: errors.join(" ") };

  try {
    const result = await query<RegionForecastRow>(
      `INSERT INTO region_forecast (bulletin_id, region_code, ${WEATHER_INSERT_COLUMNS})
       VALUES ($1, $2, ${weatherInsertPlaceholderRange(3)})
       RETURNING region_forecast_id, bulletin_id, region_code, ${WEATHER_SELECT}`,
      [input.bulletin_id, input.region_code, ...weatherInsertParams(input)]
    );
    revalidatePath(ADMIN_PATH);
    return { success: true, data: result.rows[0], message: "Region forecast created." };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function updateRegionForecast(
  id: number,
  input: RegionForecastInput
): Promise<ActionResult<RegionForecastRow>> {
  const errors = validate(input);
  if (errors.length > 0) return { success: false, error: errors.join(" ") };

  try {
    const result = await query<RegionForecastRow>(
      `UPDATE region_forecast SET
         bulletin_id = $2,
         region_code = $3,
         ${weatherUpdateAssignments(4)}
       WHERE region_forecast_id = $1
       RETURNING region_forecast_id, bulletin_id, region_code, ${WEATHER_SELECT}`,
      [id, input.bulletin_id, input.region_code, ...weatherInsertParams(input)]
    );
    if (result.rows.length === 0) {
      return { success: false, error: "Region forecast not found." };
    }
    revalidatePath(ADMIN_PATH);
    return { success: true, data: result.rows[0], message: "Region forecast updated." };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function deleteRegionForecast(id: number): Promise<ActionResult> {
  try {
    const result = await query(`DELETE FROM region_forecast WHERE region_forecast_id = $1`, [id]);
    if (result.rowCount === 0) {
      return { success: false, error: "Region forecast not found." };
    }
    revalidatePath(ADMIN_PATH);
    return { success: true, data: undefined, message: "Region forecast deleted." };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}
