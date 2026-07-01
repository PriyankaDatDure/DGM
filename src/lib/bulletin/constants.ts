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

export const HAZARDS: Hazard[] = ["Heat wave", "Flood", "Strong wind"];
export const RISK_LEVELS: RiskLevel[] = ["None", "Low", "Moderate", "High", "Very High"];
export const WIND_DIRECTIONS: WindDirection[] = [
  "North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West",
];
export const CONFIDENCE_LEVELS: Confidence[] = ["Low", "Medium", "High"];
export const SUBMISSION_STATUSES: SubmissionStatus[] = ["Draft", "Submitted", "Validated"];
