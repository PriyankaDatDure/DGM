import { listWeatherBulletins } from "@/actions/weather-bulletin";
import AdminError from "@/components/admin/AdminError";
import DashboardBulletinList from "@/components/dashboard/DashboardBulletinList";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const result = await listWeatherBulletins();
  if (!result.success) return <AdminError message={result.error} />;
  return <DashboardBulletinList initialRows={result.data} />;
}
