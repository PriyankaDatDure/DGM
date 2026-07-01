import { listNationalHazardRisks } from "@/actions/national-hazard-risk";
import { listWeatherBulletinOptions } from "@/actions/shared";
import AdminError from "@/components/admin/AdminError";
import NationalHazardRiskManager from "@/components/admin/NationalHazardRiskManager";

export const dynamic = "force-dynamic";

export default async function NationalHazardRisksAdminPage() {
  const [rowsResult, optionsResult] = await Promise.all([
    listNationalHazardRisks(),
    listWeatherBulletinOptions(),
  ]);
  if (!rowsResult.success) return <AdminError message={rowsResult.error} />;
  if (!optionsResult.success) return <AdminError message={optionsResult.error} />;
  return (
    <NationalHazardRiskManager
      initialRows={rowsResult.data}
      bulletinOptions={optionsResult.data}
    />
  );
}
