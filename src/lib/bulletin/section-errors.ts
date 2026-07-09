import type { ValidationResult } from "./types";

export type FormSection = "s1" | "s2" | "s3" | "s4";

export function sectionForFieldKey(key: string): FormSection {
  if (key.startsWith("meta:")) return "s1";
  if (key.startsWith("national:") || key.startsWith("region:")) return "s2";
  if (key.startsWith("nathazard:") || key.startsWith("regionhazard:")) return "s3";
  if (key.startsWith("interp:")) return "s4";
  return "s1";
}

export function sectionErrorCounts(result: ValidationResult | null): Record<FormSection, number> {
  const counts: Record<FormSection, number> = { s1: 0, s2: 0, s3: 0, s4: 0 };
  if (!result) return counts;
  result.fieldBlocking.forEach((key) => {
    counts[sectionForFieldKey(key)] += 1;
  });
  return counts;
}

export function firstSectionWithErrors(result: ValidationResult | null): FormSection | null {
  if (!result || result.fieldBlocking.size === 0) return null;
  const order: FormSection[] = ["s1", "s2", "s3", "s4"];
  for (const section of order) {
    if (sectionErrorCounts(result)[section] > 0) return section;
  }
  return "s1";
}
