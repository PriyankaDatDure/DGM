"use client";

import { useTranslations } from "next-intl";
import type { Confidence, Hazard, RiskLevel, SubmissionStatus, WindDirection } from "@/lib/bulletin/types";
import {
  CONFIDENCE_I18N_KEYS,
  HAZARD_I18N_KEYS,
  RISK_LEVEL_I18N_KEYS,
  SUBMISSION_STATUS_I18N_KEYS,
  WIND_DIRECTION_I18N_KEYS,
} from "./enum-keys";

export function useEnumLabels() {
  const t = useTranslations("enums");

  return {
    hazard: (value: Hazard) => t(`hazard.${HAZARD_I18N_KEYS[value]}`),
    riskLevel: (value: RiskLevel) => t(`riskLevel.${RISK_LEVEL_I18N_KEYS[value]}`),
    windDirection: (value: WindDirection) => t(`windDirection.${WIND_DIRECTION_I18N_KEYS[value]}`),
    confidence: (value: Confidence) => t(`confidence.${CONFIDENCE_I18N_KEYS[value]}`),
    submissionStatus: (value: SubmissionStatus) =>
      t(`submissionStatus.${SUBMISSION_STATUS_I18N_KEYS[value]}`),
  };
}
