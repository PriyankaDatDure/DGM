import { getTranslations } from "next-intl/server";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("admin");

  return (
    <div className="admin-layout">
      <header className="admin-header panel">
        <div>
          <h1>{t("title")}</h1>
          <p className="desc">{t("description")}</p>
        </div>
      </header>
      <AdminNav />
      <main className="admin-content">{children}</main>
    </div>
  );
}
