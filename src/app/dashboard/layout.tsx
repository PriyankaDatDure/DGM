import { getSessionUser } from "@/lib/auth/session";
import AppHeader from "@/components/layout/AppHeader";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <>
      <AppHeader username={user?.username ?? "User"} />
      <main className="dashboard-layout">{children}</main>
    </>
  );
}
