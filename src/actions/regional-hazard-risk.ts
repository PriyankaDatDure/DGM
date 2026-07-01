"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { formatDbError } from "@/lib/db/errors";
import { collectErrors, isNonEmpty, requireField } from "@/lib/validation/entities";
import type { ActionResult, RegionalHazardRiskInput } from "@/types/actions";
import type { RegionalHazardRiskRow } from "@/types/database";

const ADMIN_PATH = "/admin/regional-hazard-risks";

const SELECT_COLUMNS = `regional_hazard_risk_id, bulletin_id, region_code, hazard_type,
  risk_level, affected_prefectures, affected_subprefectures, risk_comment, possible_recommendations`;

function validate(input: RegionalHazardRiskInput): string[] {
  return collectErrors(
    requireField(input.bulletin_id, "Bulletin ID"),
    requireField(input.region_code, "Region code"),
    requireField(input.hazard_type, "Hazard type"),
    requireField(input.risk_level, "Risk level")
  );
}

function parseList(value: string): string[] | null {
  if (!isNonEmpty(value)) return null;
  const items = value.split(",").map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items : null;
}

export async function listRegionalHazardRisks(): Promise<ActionResult<RegionalHazardRiskRow[]>> {
  try {
    const result = await query<RegionalHazardRiskRow>(
      `SELECT ${SELECT_COLUMNS} FROM regional_hazard_risk ORDER BY regional_hazard_risk_id DESC`
    );
    return { success: true, data: result.rows };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function getRegionalHazardRisk(
  id: number
): Promise<ActionResult<RegionalHazardRiskRow>> {
  try {
    const result = await query<RegionalHazardRiskRow>(
      `SELECT ${SELECT_COLUMNS} FROM regional_hazard_risk WHERE regional_hazard_risk_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return { success: false, error: "Regional hazard risk not found." };
    }
    return { success: true, data: result.rows[0] };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function createRegionalHazardRisk(
  input: RegionalHazardRiskInput
): Promise<ActionResult<RegionalHazardRiskRow>> {
  const errors = validate(input);
  if (errors.length > 0) return { success: false, error: errors.join(" ") };

  try {
    const result = await query<RegionalHazardRiskRow>(
      `INSERT INTO regional_hazard_risk (
         bulletin_id, region_code, hazard_type, risk_level,
         affected_prefectures, affected_subprefectures, risk_comment, possible_recommendations
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${SELECT_COLUMNS}`,
      [
        input.bulletin_id,
        input.region_code,
        input.hazard_type,
        input.risk_level,
        parseList(input.affected_prefectures),
        parseList(input.affected_subprefectures),
        isNonEmpty(input.risk_comment) ? input.risk_comment.trim() : null,
        isNonEmpty(input.possible_recommendations) ? input.possible_recommendations.trim() : null,
      ]
    );
    revalidatePath(ADMIN_PATH);
    return { success: true, data: result.rows[0], message: "Regional hazard risk created." };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function updateRegionalHazardRisk(
  id: number,
  input: RegionalHazardRiskInput
): Promise<ActionResult<RegionalHazardRiskRow>> {
  const errors = validate(input);
  if (errors.length > 0) return { success: false, error: errors.join(" ") };

  try {
    const result = await query<RegionalHazardRiskRow>(
      `UPDATE regional_hazard_risk SET
         bulletin_id = $2,
         region_code = $3,
         hazard_type = $4,
         risk_level = $5,
         affected_prefectures = $6,
         affected_subprefectures = $7,
         risk_comment = $8,
         possible_recommendations = $9
       WHERE regional_hazard_risk_id = $1
       RETURNING ${SELECT_COLUMNS}`,
      [
        id,
        input.bulletin_id,
        input.region_code,
        input.hazard_type,
        input.risk_level,
        parseList(input.affected_prefectures),
        parseList(input.affected_subprefectures),
        isNonEmpty(input.risk_comment) ? input.risk_comment.trim() : null,
        isNonEmpty(input.possible_recommendations) ? input.possible_recommendations.trim() : null,
      ]
    );
    if (result.rows.length === 0) {
      return { success: false, error: "Regional hazard risk not found." };
    }
    revalidatePath(ADMIN_PATH);
    return { success: true, data: result.rows[0], message: "Regional hazard risk updated." };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function deleteRegionalHazardRisk(id: number): Promise<ActionResult> {
  try {
    const result = await query(
      `DELETE FROM regional_hazard_risk WHERE regional_hazard_risk_id = $1`,
      [id]
    );
    if (result.rowCount === 0) {
      return { success: false, error: "Regional hazard risk not found." };
    }
    revalidatePath(ADMIN_PATH);
    return { success: true, data: undefined, message: "Regional hazard risk deleted." };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}
