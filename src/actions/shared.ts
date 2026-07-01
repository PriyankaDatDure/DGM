"use server";

import { query } from "@/lib/db";
import { formatDbError } from "@/lib/db/errors";
import type { ActionResult } from "@/types/actions";
import type { WeatherBulletinOption } from "@/types/database";

export async function listWeatherBulletinOptions(): Promise<
  ActionResult<WeatherBulletinOption[]>
> {
  try {
    const result = await query<WeatherBulletinOption>(
      `SELECT bulletin_id, forecast_date, forecaster_name
       FROM weather_bulletin
       ORDER BY created_at DESC NULLS LAST, forecast_date DESC`
    );
    return { success: true, data: result.rows };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}
