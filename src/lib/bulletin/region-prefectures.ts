import type { RegionCode } from "./types";

/**
 * Admin / health region mapping and prefectures from
 * "Decoupage Administratif_RCA.xlsx" (Admin Region Name, Health Regions name, Prefectures).
 * Internal codes R1–R7 are stored in the database as region_code.
 */
export type RegionDefinition = {
  code: RegionCode;
  adminRegion: string;
  healthRegion: string;
  prefectures: readonly string[];
};

export const REGIONS_DEFINITION: readonly RegionDefinition[] = [
  {
    code: "R1",
    adminRegion: "Plateaux",
    healthRegion: "RS1",
    prefectures: ["Ombella -Mpoko", "Lobaye"],
  },
  {
    code: "R2",
    adminRegion: "Equateur",
    healthRegion: "RS2",
    prefectures: ["Mambéré-Kadéï", "Mamberé", "Nana-Mambéré", "Sangha-M’Baéré"],
  },
  {
    code: "R3",
    adminRegion: "Yadé",
    healthRegion: "RS3",
    prefectures: ["Ouham", "Ouham-Fafa", "Lim-Pendé", "Ouham-Pendé"],
  },
  {
    code: "R4",
    adminRegion: "Kagas",
    healthRegion: "RS4",
    prefectures: ["Kémo", "Ouaka", "Nana-Gribizi"],
  },
  {
    code: "R5",
    adminRegion: "Fertit",
    healthRegion: "RS5",
    prefectures: ["Haute Kotto", "Bamingui-Bangoran", "Vakaga"],
  },
  {
    code: "R6",
    adminRegion: "Haut Oubangui",
    healthRegion: "RS6",
    prefectures: ["Haut M’Bomou", "M’Bomou", "Basse kotto"],
  },
  {
    code: "R7",
    adminRegion: "Bas Oubangui",
    healthRegion: "RS7",
    prefectures: ["Bangui"],
  },
];

const REGION_BY_CODE = Object.fromEntries(
  REGIONS_DEFINITION.map((region) => [region.code, region])
) as Record<RegionCode, RegionDefinition>;

export const REGION_PREFECTURE_MAP: Record<RegionCode, readonly string[]> = Object.fromEntries(
  REGIONS_DEFINITION.map((region) => [region.code, region.prefectures])
) as Record<RegionCode, readonly string[]>;

export const PREFECTURES: string[] = [
  ...new Set(REGIONS_DEFINITION.flatMap((region) => [...region.prefectures])),
].sort((a, b) => a.localeCompare(b, "fr"));

export function regionDisplayLabel(code: RegionCode): string {
  const region = REGION_BY_CODE[code];
  return `${region.adminRegion} (${region.healthRegion})`;
}

export function prefecturesForRegion(region: RegionCode): readonly string[] {
  return REGION_PREFECTURE_MAP[region];
}

export function isPrefectureInRegion(prefecture: string, region: RegionCode): boolean {
  return REGION_PREFECTURE_MAP[region].includes(prefecture);
}

export function isRegionCode(value: string): value is RegionCode {
  return value in REGION_BY_CODE;
}

/** Parse comma-separated prefecture names stored in national_hazard_risk.areas_concerned. */
export function parseStoredPrefectures(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Serialize prefecture names for national_hazard_risk.areas_concerned. */
export function serializeStoredPrefectures(prefectures: readonly string[]): string | null {
  if (prefectures.length === 0) return null;
  return prefectures.join(", ");
}
