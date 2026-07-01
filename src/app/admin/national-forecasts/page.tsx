import { listNationalForecasts } from "@/actions/national-forecast";
import { listWeatherBulletinOptions } from "@/actions/shared";
import AdminError from "@/components/admin/AdminError";
import NationalForecastManager from "@/components/admin/NationalForecastManager";

export const dynamic = "force-dynamic";

export default async function NationalForecastsAdminPage() {
  const [rowsResult, optionsResult] = await Promise.all([
    listNationalForecasts(),
    listWeatherBulletinOptions(),
  ]);
  if (!rowsResult.success) return <AdminError message={rowsResult.error} />;
  if (!optionsResult.success) return <AdminError message={optionsResult.error} />;
  return (
    <NationalForecastManager
      initialRows={rowsResult.data}
      bulletinOptions={optionsResult.data}
    />
  );
}
