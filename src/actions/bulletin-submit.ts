"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/lib/db";
import { persistBulletin } from "@/lib/db/bulletin-persist";
import { formatDbError } from "@/lib/db/errors";
import { validateBulletin } from "@/lib/bulletin/validation";
import type { BulletinData } from "@/lib/bulletin/types";
import type { ActionResult } from "@/types/actions";

export async function submitBulletinToDatabase(
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
    const saved = await withTransaction((client) => persistBulletin(client, bulletin));

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath("/admin/weather-bulletins");
    revalidatePath("/admin/national-forecasts");
    revalidatePath("/admin/region-forecasts");
    revalidatePath("/admin/national-hazard-risks");
    revalidatePath("/admin/regional-hazard-risks");
    revalidatePath("/admin/meteorological-interpretations");

    return {
      success: true,
      data: saved,
      message: `Bulletin saved (bulletin_id: ${saved.bulletin_id}).`,
    };
  } catch (error) {
    return { success: false, error: formatDbError(error) };
  }
}
