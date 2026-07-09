import { Hazard, RegionCode, RiskLevel, WindDirection, Confidence, SubmissionStatus } from "./types";
import {
  PREFECTURES,
  REGION_PREFECTURE_MAP,
  REGIONS_DEFINITION,
  isPrefectureInRegion,
  isRegionCode,
  prefecturesForRegion,
  regionDisplayLabel,
} from "./region-prefectures";

export const REGIONS: RegionCode[] = REGIONS_DEFINITION.map((region) => region.code);

export {
  PREFECTURES,
  REGION_PREFECTURE_MAP,
  REGIONS_DEFINITION,
  isPrefectureInRegion,
  isRegionCode,
  prefecturesForRegion,
  regionDisplayLabel,
};

export const HAZARDS: Hazard[] = ["Heat wave", "Flood", "Strong wind", "Dust"];
export const RISK_LEVELS: RiskLevel[] = ["None", "Low", "Moderate", "High", "Very High"];
export const WIND_DIRECTIONS: WindDirection[] = [
  "North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West",
];
export const CONFIDENCE_LEVELS: Confidence[] = ["Low", "Medium", "High"];
export const THERMAL_COMFORT_LEVELS = [
  "Comfortable",
  "Thermal discomfort",
  "Significant thermal discomfort",
  "Confirmed health danger",
  "Danger of death",
] as const;
export type ThermalComfortLevel = (typeof THERMAL_COMFORT_LEVELS)[number];
export const SUBMISSION_STATUSES: SubmissionStatus[] = ["Draft", "Submitted", "Validated"];
