"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { formatDbError } from "@/lib/db/errors";
import { collectErrors, isNonEmpty, requireField } from "@/lib/validation/entities";
import type { ActionResult, NationalHazardRiskInput } from "@/types/actions";
import type { NationalHazardRiskRow } from "@/types/database";

const ADMIN_PATH = "/admin/national-hazard-risks";

const SELECT_COLUMNS = `national_hazard_risk_id, bulletin_id, forecast_date, hazard_type, risk_level,
  areas_concerned, risk_comment, possible_recommendations`;

function validate(input: NationalHazardRiskInput): string[] {
  return collectErrors(
    requireField(input.bulletin_id, "Bulletin ID"),
    requireField(input.forecast_date, "Forecast date"),
    requireField(input.hazard_type, "Hazard type"),
    requireField(input.risk_level, "Risk level")
  );
}

export async function listNationalHazardRisks(): Promise<ActionResult<NationalHazardRiskRow[]>> {
  try {
    const result = await query<NationalHazardRiskRow>(
      `SELECT ${SELECT_COLUMNS} FROM national_hazard_risk ORDER BY national_hazard_risk_id DESC`
    );
    return { success: true, data: result.rows };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function getNationalHazardRisk(
  id: number
): Promise<ActionResult<NationalHazardRiskRow>> {
  try {
    const result = await query<NationalHazardRiskRow>(
      `SELECT ${SELECT_COLUMNS} FROM national_hazard_risk WHERE national_hazard_risk_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return { success: false, error: "National hazard risk not found." };
    }
    return { success: true, data: result.rows[0] };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function createNationalHazardRisk(
  input: NationalHazardRiskInput
): Promise<ActionResult<NationalHazardRiskRow>> {
  const errors = validate(input);
  if (errors.length > 0) return { success: false, error: errors.join(" ") };

  try {
    const result = await query<NationalHazardRiskRow>(
      `INSERT INTO national_hazard_risk (
         bulletin_id, forecast_date, hazard_type, risk_level, areas_concerned,
         risk_comment, possible_recommendations
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${SELECT_COLUMNS}`,
      [
        input.bulletin_id,
        input.forecast_date,
        input.hazard_type,
        input.risk_level,
        isNonEmpty(input.areas_concerned) ? input.areas_concerned.trim() : null,
        isNonEmpty(input.risk_comment) ? input.risk_comment.trim() : null,
        isNonEmpty(input.possible_recommendations) ? input.possible_recommendations.trim() : null,
      ]
    );
    revalidatePath(ADMIN_PATH);
    return { success: true, data: result.rows[0], message: "National hazard risk created." };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function updateNationalHazardRisk(
  id: number,
  input: NationalHazardRiskInput
): Promise<ActionResult<NationalHazardRiskRow>> {
  const errors = validate(input);
  if (errors.length > 0) return { success: false, error: errors.join(" ") };

  try {
    const result = await query<NationalHazardRiskRow>(
      `UPDATE national_hazard_risk SET
         bulletin_id = $2,
         forecast_date = $3,
         hazard_type = $4,
         risk_level = $5,
         areas_concerned = $6,
         risk_comment = $7,
         possible_recommendations = $8
       WHERE national_hazard_risk_id = $1
       RETURNING ${SELECT_COLUMNS}`,
      [
        id,
        input.bulletin_id,
        input.forecast_date,
        input.hazard_type,
        input.risk_level,
        isNonEmpty(input.areas_concerned) ? input.areas_concerned.trim() : null,
        isNonEmpty(input.risk_comment) ? input.risk_comment.trim() : null,
        isNonEmpty(input.possible_recommendations) ? input.possible_recommendations.trim() : null,
      ]
    );
    if (result.rows.length === 0) {
      return { success: false, error: "National hazard risk not found." };
    }
    revalidatePath(ADMIN_PATH);
    return { success: true, data: result.rows[0], message: "National hazard risk updated." };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function deleteNationalHazardRisk(id: number): Promise<ActionResult> {
  try {
    const result = await query(`DELETE FROM national_hazard_risk WHERE national_hazard_risk_id = $1`, [id]);
    if (result.rowCount === 0) {
      return { success: false, error: "National hazard risk not found." };
    }
    revalidatePath(ADMIN_PATH);
    return { success: true, data: undefined, message: "National hazard risk deleted." };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}
