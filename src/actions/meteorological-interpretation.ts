"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { formatDbError } from "@/lib/db/errors";
import { collectErrors, isNonEmpty, requireField } from "@/lib/validation/entities";
import type { ActionResult, MeteorologicalInterpretationInput } from "@/types/actions";
import type { MeteorologicalInterpretationRow } from "@/types/database";

const ADMIN_PATH = "/admin/meteorological-interpretations";

const SELECT_COLUMNS = `interpretation_id, bulletin_id, general_situation, expected_conditions,
  risk_areas, expected_evolution, recommendations, additional_notes`;

function validate(input: MeteorologicalInterpretationInput): string[] {
  return collectErrors(
    requireField(input.bulletin_id, "Bulletin ID"),
    requireField(input.general_situation, "General situation")
  );
}

export async function listMeteorologicalInterpretations(): Promise<
  ActionResult<MeteorologicalInterpretationRow[]>
> {
  try {
    const result = await query<MeteorologicalInterpretationRow>(
      `SELECT ${SELECT_COLUMNS}
       FROM meteorological_interpretation
       ORDER BY interpretation_id DESC`
    );
    return { success: true, data: result.rows };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function getMeteorologicalInterpretation(
  id: number
): Promise<ActionResult<MeteorologicalInterpretationRow>> {
  try {
    const result = await query<MeteorologicalInterpretationRow>(
      `SELECT ${SELECT_COLUMNS} FROM meteorological_interpretation WHERE interpretation_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return { success: false, error: "Meteorological interpretation not found." };
    }
    return { success: true, data: result.rows[0] };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function createMeteorologicalInterpretation(
  input: MeteorologicalInterpretationInput
): Promise<ActionResult<MeteorologicalInterpretationRow>> {
  const errors = validate(input);
  if (errors.length > 0) return { success: false, error: errors.join(" ") };

  try {
    const result = await query<MeteorologicalInterpretationRow>(
      `INSERT INTO meteorological_interpretation (
         bulletin_id, general_situation, expected_conditions, risk_areas,
         expected_evolution, recommendations, additional_notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${SELECT_COLUMNS}`,
      [
        input.bulletin_id,
        input.general_situation.trim(),
        isNonEmpty(input.expected_conditions) ? input.expected_conditions.trim() : null,
        isNonEmpty(input.risk_areas) ? input.risk_areas.trim() : null,
        isNonEmpty(input.expected_evolution) ? input.expected_evolution.trim() : null,
        isNonEmpty(input.recommendations) ? input.recommendations.trim() : null,
        isNonEmpty(input.additional_notes) ? input.additional_notes.trim() : null,
      ]
    );
    revalidatePath(ADMIN_PATH);
    return {
      success: true,
      data: result.rows[0],
      message: "Meteorological interpretation created.",
    };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function updateMeteorologicalInterpretation(
  id: number,
  input: MeteorologicalInterpretationInput
): Promise<ActionResult<MeteorologicalInterpretationRow>> {
  const errors = validate(input);
  if (errors.length > 0) return { success: false, error: errors.join(" ") };

  try {
    const result = await query<MeteorologicalInterpretationRow>(
      `UPDATE meteorological_interpretation SET
         bulletin_id = $2,
         general_situation = $3,
         expected_conditions = $4,
         risk_areas = $5,
         expected_evolution = $6,
         recommendations = $7,
         additional_notes = $8
       WHERE interpretation_id = $1
       RETURNING ${SELECT_COLUMNS}`,
      [
        id,
        input.bulletin_id,
        input.general_situation.trim(),
        isNonEmpty(input.expected_conditions) ? input.expected_conditions.trim() : null,
        isNonEmpty(input.risk_areas) ? input.risk_areas.trim() : null,
        isNonEmpty(input.expected_evolution) ? input.expected_evolution.trim() : null,
        isNonEmpty(input.recommendations) ? input.recommendations.trim() : null,
        isNonEmpty(input.additional_notes) ? input.additional_notes.trim() : null,
      ]
    );
    if (result.rows.length === 0) {
      return { success: false, error: "Meteorological interpretation not found." };
    }
    revalidatePath(ADMIN_PATH);
    return {
      success: true,
      data: result.rows[0],
      message: "Meteorological interpretation updated.",
    };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function deleteMeteorologicalInterpretation(id: number): Promise<ActionResult> {
  try {
    const result = await query(
      `DELETE FROM meteorological_interpretation WHERE interpretation_id = $1`,
      [id]
    );
    if (result.rowCount === 0) {
      return { success: false, error: "Meteorological interpretation not found." };
    }
    revalidatePath(ADMIN_PATH);
    return {
      success: true,
      data: undefined,
      message: "Meteorological interpretation deleted.",
    };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}
