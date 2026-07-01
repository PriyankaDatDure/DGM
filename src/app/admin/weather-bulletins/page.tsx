import { listWeatherBulletins } from "@/actions/weather-bulletin";
import AdminError from "@/components/admin/AdminError";
import WeatherBulletinManager from "@/components/admin/WeatherBulletinManager";

export const dynamic = "force-dynamic";

export default async function WeatherBulletinsAdminPage() {
  const result = await listWeatherBulletins();
  if (!result.success) {
    return <AdminError message={result.error} />;
  }
  return <WeatherBulletinManager initialRows={result.data} />;
}
