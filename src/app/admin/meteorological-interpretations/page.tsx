import { listMeteorologicalInterpretations } from "@/actions/meteorological-interpretation";
import { listWeatherBulletinOptions } from "@/actions/shared";
import AdminError from "@/components/admin/AdminError";
import MeteorologicalInterpretationManager from "@/components/admin/MeteorologicalInterpretationManager";

export const dynamic = "force-dynamic";

export default async function MeteorologicalInterpretationsAdminPage() {
  const [rowsResult, optionsResult] = await Promise.all([
    listMeteorologicalInterpretations(),
    listWeatherBulletinOptions(),
  ]);

  if (!rowsResult.success) return <AdminError message={rowsResult.error} />;
  if (!optionsResult.success) return <AdminError message={optionsResult.error} />;

  return (
    <MeteorologicalInterpretationManager
      initialRows={rowsResult.data}
      bulletinOptions={optionsResult.data}
    />
  );
}
