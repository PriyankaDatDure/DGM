import { listRegionForecasts } from "@/actions/region-forecast";
import { listWeatherBulletinOptions } from "@/actions/shared";
import AdminError from "@/components/admin/AdminError";
import RegionForecastManager from "@/components/admin/RegionForecastManager";

export const dynamic = "force-dynamic";

export default async function RegionForecastsAdminPage() {
  const [rowsResult, optionsResult] = await Promise.all([
    listRegionForecasts(),
    listWeatherBulletinOptions(),
  ]);
  if (!rowsResult.success) return <AdminError message={rowsResult.error} />;
  if (!optionsResult.success) return <AdminError message={optionsResult.error} />;
  return (
    <RegionForecastManager
      initialRows={rowsResult.data}
      bulletinOptions={optionsResult.data}
    />
  );
}
