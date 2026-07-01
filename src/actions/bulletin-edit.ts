"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/lib/db";
import { loadBulletinById } from "@/lib/db/bulletin-load";
import { updateBulletin } from "@/lib/db/bulletin-update";
import { formatDbError } from "@/lib/db/errors";
import { validateBulletin } from "@/lib/bulletin/validation";
import type { BulletinData } from "@/lib/bulletin/types";
import type { ActionResult } from "@/types/actions";

const REVALIDATE_PATHS = [
  "/dashboard",
  "/admin",
  "/admin/weather-bulletins",
  "/admin/national-forecasts",
  "/admin/region-forecasts",
  "/admin/national-hazard-risks",
  "/admin/regional-hazard-risks",
  "/admin/meteorological-interpretations",
];

function revalidateBulletinPaths() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

export async function getBulletinForEdit(
  bulletinId: string
): Promise<ActionResult<BulletinData>> {
  if (!bulletinId.trim()) {
    return { success: false, error: "Bulletin ID is required." };
  }

  try {
    const bulletin = await loadBulletinById(bulletinId);
    if (!bulletin) {
      return { success: false, error: "Weather bulletin not found." };
    }
    return { success: true, data: bulletin };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}

export async function updateBulletinToDatabase(
  bulletinId: string,
  bulletin: BulletinData
): Promise<ActionResult<{ bulletin_id: string; forecast_date: string }>> {
  const validation = validateBulletin(bulletin);
  if (validation.blocking.length > 0) {
    return {
      success: false,
      error: validation.blocking.slice(0, 3).join(" "),
    };
  }

  try {
    const saved = await withTransaction((client) => updateBulletin(client, bulletinId, bulletin));
    revalidateBulletinPaths();
    return {
      success: true,
      data: saved,
      message: `Bulletin updated (bulletin_id: ${saved.bulletin_id}).`,
    };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}
