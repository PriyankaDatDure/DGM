import type {
  Confidence,
  Hazard,
  RiskLevel,
  SubmissionStatus,
  WindDirection,
} from "@/lib/bulletin/types";

export const HAZARD_I18N_KEYS: Record<Hazard, string> = {
  "Heat wave": "heatWave",
  Flood: "flood",
  "Strong wind": "strongWind",
  Dust: "dust",
};

export const RISK_LEVEL_I18N_KEYS: Record<RiskLevel, string> = {
  None: "none",
  Low: "low",
  Moderate: "moderate",
  High: "high",
  "Very High": "veryHigh",
};

export const WIND_DIRECTION_I18N_KEYS: Record<WindDirection, string> = {
  North: "north",
  "North-East": "northEast",
  East: "east",
  "South-East": "southEast",
  South: "south",
  "South-West": "southWest",
  West: "west",
  "North-West": "northWest",
};

export const CONFIDENCE_I18N_KEYS: Record<Confidence, string> = {
  Low: "low",
  Medium: "medium",
  High: "high",
};

export const SUBMISSION_STATUS_I18N_KEYS: Record<SubmissionStatus, string> = {
  Draft: "draft",
  Submitted: "submitted",
  Validated: "validated",
};
