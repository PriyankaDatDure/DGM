import type { Hazard, RegionCode, RiskLevel, ValidationMessage } from "@/lib/bulletin/types";
import { regionDisplayLabel } from "@/lib/bulletin/region-prefectures";
import { HAZARD_I18N_KEYS, RISK_LEVEL_I18N_KEYS } from "./enum-keys";

type Translator = (key: string, values?: Record<string, string | number>) => string;

export function formatValidationMessage(
  tValidation: Translator,
  tEnums: Translator,
  tWizard: Translator,
  message: ValidationMessage
): string {
  const params: Record<string, string | number> = { ...(message.params ?? {}) };

  if (params.scope === "national") {
    params.scope = tWizard("scopes.national");
  } else if (typeof params.scope === "string" && params.scope.startsWith("region:")) {
    params.scope = regionDisplayLabel(params.scope.slice(7) as RegionCode);
  }

  if (typeof params.hazard === "string" && params.hazard in HAZARD_I18N_KEYS) {
    params.hazard = tEnums(
      `hazard.${HAZARD_I18N_KEYS[params.hazard as Hazard]}`
    );
  }

  if (typeof params.level === "string" && params.level in RISK_LEVEL_I18N_KEYS) {
    params.level = tEnums(
      `riskLevel.${RISK_LEVEL_I18N_KEYS[params.level as RiskLevel]}`
    );
  }

  if (typeof params.region === "string" && /^R\d$/.test(params.region)) {
    params.region = regionDisplayLabel(params.region as RegionCode);
  }

  return tValidation(message.key, params);
}

export function formatValidationMessages(
  messages: ValidationMessage[],
  tValidation: Translator,
  tEnums: Translator,
  tWizard: Translator
): string[] {
  return messages.map((message) =>
    formatValidationMessage(tValidation, tEnums, tWizard, message)
  );
}
