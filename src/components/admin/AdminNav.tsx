import Link from "next/link";
import { getTranslations } from "next-intl/server";

const LINKS = [
  { href: "/admin/weather-bulletins", labelKey: "weatherBulletins" as const },
  { href: "/admin/national-forecasts", labelKey: "nationalForecasts" as const },
  { href: "/admin/region-forecasts", labelKey: "regionForecasts" as const },
  { href: "/admin/national-hazard-risks", labelKey: "nationalHazardRisks" as const },
  { href: "/admin/regional-hazard-risks", labelKey: "regionalHazardRisks" as const },
  { href: "/admin/meteorological-interpretations", labelKey: "interpretations" as const },
];

export default async function AdminNav() {
  const tNav = await getTranslations("nav");
  const tAdmin = await getTranslations("admin");

  return (
    <nav className="admin-nav">
      <Link href="/dashboard" className="admin-nav-link">
        {tNav("dashboard")}
      </Link>
      <Link href="/" className="admin-nav-link">
        {tNav("transmissionForm")}
      </Link>
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} className="admin-nav-link">
          {tAdmin(`nav.${link.labelKey}`)}
        </Link>
      ))}
    </nav>
  );
}
