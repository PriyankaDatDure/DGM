import { listRegionalHazardRisks } from "@/actions/regional-hazard-risk";
import { listWeatherBulletinOptions } from "@/actions/shared";
import AdminError from "@/components/admin/AdminError";
import RegionalHazardRiskManager from "@/components/admin/RegionalHazardRiskManager";

export const dynamic = "force-dynamic";

export default async function RegionalHazardRisksAdminPage() {
  const [rowsResult, optionsResult] = await Promise.all([
    listRegionalHazardRisks(),
    listWeatherBulletinOptions(),
  ]);
  if (!rowsResult.success) return <AdminError message={rowsResult.error} />;
  if (!optionsResult.success) return <AdminError message={optionsResult.error} />;
  return (
    <RegionalHazardRiskManager
      initialRows={rowsResult.data}
      bulletinOptions={optionsResult.data}
    />
  );
}
