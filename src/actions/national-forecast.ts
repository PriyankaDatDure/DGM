"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { formatDbError } from "@/lib/db/errors";
import {
  BULLETIN_CONTEXT_COLUMNS,
  bulletinContextParams,
  validateBulletinContext,
  validateWeatherFields,
  weatherInsertParams,
  weatherInsertPlaceholderRange,
  weatherUpdateAssignments,
  WEATHER_INSERT_COLUMNS,
  WEATHER_SELECT,
} from "@/lib/validation/weather-fields";
import { collectErrors, requireField } from "@/lib/validation/entities";
import type { ActionResult, NationalForecastInput } from "@/types/actions";
import type { NationalForecastRow } from "@/types/database";

const ADMIN_PATH = "/admin/national-forecasts";

function validate(input: NationalForecastInput): string[] {
  return collectErrors(
    requireField(input.bulletin_id, "Bulletin ID"),
    ...validateBulletinContext(input),
    ...validateWeatherFields(input, "National forecast")
  );
}

export async function listNationalForecasts(): Promise<ActionResult<NationalForecastRow[]>> {
  try {
    const result = await query<NationalForecastRow>(
      `SELECT national_forecast_id, bulletin_id, ${BULLETIN_CONTEXT_COLUMNS}, ${WEATHER_SELECT}
       FROM national_forecast ORDER BY national_forecast_id DESC`
    );
    return { success: true, data: result.rows };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function getNationalForecast(id: number): Promise<ActionResult<NationalForecastRow>> {
  try {
    const result = await query<NationalForecastRow>(
      `SELECT national_forecast_id, bulletin_id, ${BULLETIN_CONTEXT_COLUMNS}, ${WEATHER_SELECT}
       FROM national_forecast WHERE national_forecast_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return { success: false, error: "National forecast not found." };
    }
    return { success: true, data: result.rows[0] };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function createNationalForecast(
  input: NationalForecastInput
): Promise<ActionResult<NationalForecastRow>> {
  const errors = validate(input);
  if (errors.length > 0) return { success: false, error: errors.join(" ") };

  try {
    const result = await query<NationalForecastRow>(
      `INSERT INTO national_forecast (bulletin_id, ${BULLETIN_CONTEXT_COLUMNS}, ${WEATHER_INSERT_COLUMNS})
       VALUES ($1, $2, $3, $4, ${weatherInsertPlaceholderRange(5)})
       RETURNING national_forecast_id, bulletin_id, ${BULLETIN_CONTEXT_COLUMNS}, ${WEATHER_SELECT}`,
      [input.bulletin_id, ...bulletinContextParams(input), ...weatherInsertParams(input)]
    );
    revalidatePath(ADMIN_PATH);
    return { success: true, data: result.rows[0], message: "National forecast created." };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function updateNationalForecast(
  id: number,
  input: NationalForecastInput
): Promise<ActionResult<NationalForecastRow>> {
  const errors = validate(input);
  if (errors.length > 0) return { success: false, error: errors.join(" ") };

  try {
    const result = await query<NationalForecastRow>(
      `UPDATE national_forecast SET
         bulletin_id = $2,
         forecast_date = $3,
         publication_time = $4,
         validity_period = $5,
         ${weatherUpdateAssignments(6)}
       WHERE national_forecast_id = $1
       RETURNING national_forecast_id, bulletin_id, ${BULLETIN_CONTEXT_COLUMNS}, ${WEATHER_SELECT}`,
      [id, input.bulletin_id, ...bulletinContextParams(input), ...weatherInsertParams(input)]
    );
    if (result.rows.length === 0) {
      return { success: false, error: "National forecast not found." };
    }
    revalidatePath(ADMIN_PATH);
    return { success: true, data: result.rows[0], message: "National forecast updated." };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function deleteNationalForecast(id: number): Promise<ActionResult> {
  try {
    const result = await query(`DELETE FROM national_forecast WHERE national_forecast_id = $1`, [id]);
    if (result.rowCount === 0) {
      return { success: false, error: "National forecast not found." };
    }
    revalidatePath(ADMIN_PATH);
    return { success: true, data: undefined, message: "National forecast deleted." };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}
