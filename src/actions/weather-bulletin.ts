"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { formatDbError } from "@/lib/db/errors";
import { collectErrors, isNonEmpty, requireField } from "@/lib/validation/entities";
import type { ActionResult, WeatherBulletinInput } from "@/types/actions";
import type { WeatherBulletinRow } from "@/types/database";

const ADMIN_PATHS = ["/admin/weather-bulletins", "/dashboard"];

const SELECT_COLUMNS = `bulletin_id, forecast_date, publication_time, validity_period,
  data_sources, national_forecast_text, general_comment, submission_status,
  forecaster_name, created_at, updated_at`;

function validate(input: WeatherBulletinInput): string[] {
  return collectErrors(
    requireField(input.forecast_date, "Forecast date"),
    requireField(input.publication_time, "Publication time"),
    requireField(input.validity_period, "Validity period"),
    requireField(input.data_sources, "Data sources"),
    requireField(input.national_forecast_text, "National forecast summary"),
    requireField(input.submission_status, "Submission status"),
    requireField(input.forecaster_name, "Forecaster name")
  );
}

export async function listWeatherBulletins(): Promise<ActionResult<WeatherBulletinRow[]>> {
  try {
    const result = await query<WeatherBulletinRow>(
      `SELECT ${SELECT_COLUMNS} FROM weather_bulletin ORDER BY created_at DESC NULLS LAST, forecast_date DESC`
    );
    return { success: true, data: result.rows };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function getWeatherBulletin(id: string): Promise<ActionResult<WeatherBulletinRow>> {
  try {
    const result = await query<WeatherBulletinRow>(
      `SELECT ${SELECT_COLUMNS} FROM weather_bulletin WHERE bulletin_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return { success: false, error: "Weather bulletin not found." };
    }
    return { success: true, data: result.rows[0] };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function createWeatherBulletin(
  input: WeatherBulletinInput
): Promise<ActionResult<WeatherBulletinRow>> {
  const errors = validate(input);
  if (errors.length > 0) return { success: false, error: errors.join(" ") };

  try {
    const result = await query<WeatherBulletinRow>(
      `INSERT INTO weather_bulletin (
         forecast_date, publication_time, validity_period, data_sources,
         national_forecast_text, general_comment, submission_status, forecaster_name
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${SELECT_COLUMNS}`,
      [
        input.forecast_date,
        input.publication_time,
        input.validity_period.trim(),
        input.data_sources.trim(),
        input.national_forecast_text.trim(),
        isNonEmpty(input.general_comment) ? input.general_comment.trim() : null,
        input.submission_status,
        input.forecaster_name.trim(),
      ]
    );
    revalidatePath(ADMIN_PATHS[0]);
    revalidatePath(ADMIN_PATHS[1]);
    return { success: true, data: result.rows[0], message: "Weather bulletin created." };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function updateWeatherBulletin(
  id: string,
  input: WeatherBulletinInput
): Promise<ActionResult<WeatherBulletinRow>> {
  const errors = validate(input);
  if (errors.length > 0) return { success: false, error: errors.join(" ") };

  try {
    const result = await query<WeatherBulletinRow>(
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
       WHERE bulletin_id = $1
       RETURNING ${SELECT_COLUMNS}`,
      [
        id,
        input.forecast_date,
        input.publication_time,
        input.validity_period.trim(),
        input.data_sources.trim(),
        input.national_forecast_text.trim(),
        isNonEmpty(input.general_comment) ? input.general_comment.trim() : null,
        input.submission_status,
        input.forecaster_name.trim(),
      ]
    );
    if (result.rows.length === 0) {
      return { success: false, error: "Weather bulletin not found." };
    }
    revalidatePath(ADMIN_PATHS[0]);
    revalidatePath(ADMIN_PATHS[1]);
    return { success: true, data: result.rows[0], message: "Weather bulletin updated." };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function deleteWeatherBulletin(id: string): Promise<ActionResult> {
  try {
    const result = await query(`DELETE FROM weather_bulletin WHERE bulletin_id = $1`, [id]);
    if (result.rowCount === 0) {
      return { success: false, error: "Weather bulletin not found." };
    }
    revalidatePath(ADMIN_PATHS[0]);
    revalidatePath(ADMIN_PATHS[1]);
    return { success: true, data: undefined, message: "Weather bulletin deleted." };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}
