import Link from "next/link";

const LINKS = [
  { href: "/admin/weather-bulletins", label: "Weather bulletins" },
  { href: "/admin/national-forecasts", label: "National forecasts" },
  { href: "/admin/region-forecasts", label: "Region forecasts" },
  { href: "/admin/national-hazard-risks", label: "National hazard risks" },
  { href: "/admin/regional-hazard-risks", label: "Regional hazard risks" },
  { href: "/admin/meteorological-interpretations", label: "Interpretations" },
];

export default function AdminNav() {
  return (
    <nav className="admin-nav">
      <Link href="/dashboard" className="admin-nav-link">
        Linelist
      </Link>
      <Link href="/" className="admin-nav-link">
        Transmission form
      </Link>
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} className="admin-nav-link">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
