import AdminNav from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-layout">
      <header className="admin-header panel">
        <div>
          <h1>Dashboard</h1>
          <p className="desc">Manage weather bulletin records stored in PostgreSQL.</p>
        </div>
      </header>
      <AdminNav />
      <main className="admin-content">{children}</main>
    </div>
  );
}
