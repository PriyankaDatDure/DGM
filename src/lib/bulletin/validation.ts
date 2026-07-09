import { BulletinData, ValidationMessage, ValidationResult, WeatherEntry, WizardStep } from "./types";
import { HAZARDS, REGIONS, RISK_LEVELS, THERMAL_COMFORT_LEVELS, WIND_DIRECTIONS, isPrefectureInRegion } from "./constants";
import { syncValidityFromForecast } from "./validity-period";

const num = (v: string): number => parseFloat(v);
const has = (v: string | undefined): boolean => v !== undefined && v.trim() !== "";

function isNumeric(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") return false;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed);
}

function isHighOrVeryHigh(level: string): boolean {
  return level === "High" || level === "Very High";
}

function markBlock(result: ValidationResult, fieldKeys: string | string[], message: ValidationMessage) {
  result.blocking.push(message);
  for (const key of Array.isArray(fieldKeys) ? fieldKeys : [fieldKeys]) {
    result.fieldBlocking.add(key);
    result.fieldBlockingMsg[key] = message;
  }
}

function markWarn(result: ValidationResult, fieldKeys: string | string[], message: ValidationMessage) {
  result.warnings.push(message);
  for (const key of Array.isArray(fieldKeys) ? fieldKeys : [fieldKeys]) {
    result.fieldWarning.add(key);
    result.fieldWarningMsg[key] = message;
  }
}

type WeatherScope = { scope: "national" } | { scope: "region"; region: string };

function validateWeatherEntry(
  weatherScope: WeatherScope,
  keyPrefix: string,
  w: WeatherEntry,
  result: ValidationResult
) {
  const scopeParam =
    weatherScope.scope === "national" ? "national" : `region:${weatherScope.region}`;
  const p = { scope: scopeParam };

  if (!has(w.temp_min_c)) {
    markBlock(result, `${keyPrefix}:temp_min_c`, { key: "tempMinMissing", params: p });
  } else if (!isNumeric(w.temp_min_c)) {
    markBlock(result, `${keyPrefix}:temp_min_c`, { key: "tempMinInvalid", params: p });
  }

  if (!has(w.temp_max_c)) {
    markBlock(result, `${keyPrefix}:temp_max_c`, { key: "tempMaxMissing", params: p });
  } else if (!isNumeric(w.temp_max_c)) {
    markBlock(result, `${keyPrefix}:temp_max_c`, { key: "tempMaxInvalid", params: p });
  }

  const tmin = num(w.temp_min_c);
  const tmax = num(w.temp_max_c);

  if (isNumeric(w.temp_min_c) && isNumeric(w.temp_max_c) && tmin > tmax) {
    const message = { key: "tempMinHigherThanMax", params: p };
    markBlock(result, [`${keyPrefix}:temp_min_c`, `${keyPrefix}:temp_max_c`], message);
  }

  if (isNumeric(w.temp_min_c) && (tmin < 10 || tmin > 50)) {
    markWarn(result, `${keyPrefix}:temp_min_c`, { key: "tempRangeWarning", params: p });
  }
  if (isNumeric(w.temp_max_c) && (tmax < 10 || tmax > 50)) {
    markWarn(result, `${keyPrefix}:temp_max_c`, { key: "tempRangeWarning", params: p });
  }

  if (!has(w.temp_ressentie_c)) {
    markBlock(result, `${keyPrefix}:temp_ressentie_c`, { key: "thermalComfortMissing", params: p });
  } else if (!(THERMAL_COMFORT_LEVELS as readonly string[]).includes(w.temp_ressentie_c)) {
    markBlock(result, `${keyPrefix}:temp_ressentie_c`, {
      key: isNumeric(w.temp_ressentie_c) ? "thermalComfortNumeric" : "thermalComfortInvalid",
      params: p,
    });
  }

  if (!has(w.relative_humidity_pct)) {
    markBlock(result, `${keyPrefix}:relative_humidity_pct`, { key: "humidityMissing", params: p });
  } else {
    const hum = num(w.relative_humidity_pct);
    if (!isNumeric(w.relative_humidity_pct) || hum < 0 || hum > 100) {
      markBlock(result, `${keyPrefix}:relative_humidity_pct`, { key: "humidityRangeError", params: p });
    } else if (hum > 95 || hum < 20) {
      markWarn(result, `${keyPrefix}:relative_humidity_pct`, { key: "humidityWarning", params: p });
    }
  }

  if (has(w.pressure_hpa)) {
    const pres = num(w.pressure_hpa);
    if (!isNumeric(w.pressure_hpa) || pres <= 0) {
      markBlock(result, `${keyPrefix}:pressure_hpa`, { key: "pressureError", params: p });
    } else if (pres < 850 || pres > 1100) {
      markWarn(result, `${keyPrefix}:pressure_hpa`, { key: "pressureWarning", params: p });
    }
  }

  if (!has(w.wind_direction)) {
    markBlock(result, `${keyPrefix}:wind_direction`, { key: "windDirectionMissing", params: p });
  } else if (!(WIND_DIRECTIONS as readonly string[]).includes(w.wind_direction)) {
    markBlock(result, `${keyPrefix}:wind_direction`, { key: "windDirectionInvalid", params: p });
  }

  if (!has(w.wind_speed_kmh)) {
    markBlock(result, `${keyPrefix}:wind_speed_kmh`, { key: "windSpeedMissing", params: p });
  } else if (!isNumeric(w.wind_speed_kmh)) {
    markBlock(result, `${keyPrefix}:wind_speed_kmh`, { key: "windSpeedInvalid", params: p });
  } else {
    const wspd = num(w.wind_speed_kmh);
    if (wspd < 0) {
      markBlock(result, `${keyPrefix}:wind_speed_kmh`, { key: "windSpeedNegative", params: p });
    } else if (wspd > 108) {
      markBlock(result, `${keyPrefix}:wind_speed_kmh`, { key: "windSpeedRangeError", params: p });
    }
  }

  if (!has(w.rainfall_mm)) {
    markBlock(result, `${keyPrefix}:rainfall_mm`, { key: "rainfallMissing", params: p });
  } else if (!isNumeric(w.rainfall_mm)) {
    markBlock(result, `${keyPrefix}:rainfall_mm`, { key: "rainfallInvalid", params: p });
  } else {
    const rain = num(w.rainfall_mm);
    if (rain < 0) {
      markBlock(result, `${keyPrefix}:rainfall_mm`, { key: "rainfallNegative", params: p });
    } else if (rain > 255) {
      markBlock(result, `${keyPrefix}:rainfall_mm`, { key: "rainfallRangeError", params: p });
    }
  }

  if (has(w.sunshine_pct)) {
    const sun = num(w.sunshine_pct);
    if (!isNumeric(w.sunshine_pct) || sun < 0 || sun > 20) {
      markBlock(result, `${keyPrefix}:sunshine_pct`, { key: "sunshineRangeError", params: p });
    }
  }
}

function validateRiskLevel(
  result: ValidationResult,
  riskLevel: string,
  fieldKey: string,
  messageKey: string,
  params?: Record<string, string>
) {
  if (!has(riskLevel)) {
    markBlock(result, fieldKey, { key: messageKey, params });
  } else if (!RISK_LEVELS.includes(riskLevel as (typeof RISK_LEVELS)[number])) {
    markBlock(result, fieldKey, { key: "riskLevelInvalid", params });
  }
}

function createResult(): ValidationResult {
  return {
    blocking: [],
    warnings: [],
    fieldBlocking: new Set<string>(),
    fieldWarning: new Set<string>(),
    fieldBlockingMsg: {},
    fieldWarningMsg: {},
  };
}

function mergeResults(...parts: ValidationResult[]): ValidationResult {
  const merged = createResult();
  for (const part of parts) {
    merged.blocking.push(...part.blocking);
    merged.warnings.push(...part.warnings);
    part.fieldBlocking.forEach((key) => {
      merged.fieldBlocking.add(key);
      if (part.fieldBlockingMsg[key]) merged.fieldBlockingMsg[key] = part.fieldBlockingMsg[key];
    });
    part.fieldWarning.forEach((key) => {
      merged.fieldWarning.add(key);
      if (part.fieldWarningMsg[key]) merged.fieldWarningMsg[key] = part.fieldWarningMsg[key];
    });
  }
  return merged;
}

export const WIZARD_STEP_COUNT = 6;

function validateMetadataStep(data: BulletinData): ValidationResult {
  const result = createResult();
  const m = syncValidityFromForecast(data.metadata);

  if (!has(m.forecast_date)) {
    markBlock(result, "meta:forecast_date", { key: "forecastDateMissing" });
  } else {
    const days = (Date.now() - new Date(m.forecast_date).getTime()) / 86400000;
    if (days > 2) {
      markWarn(result, "meta:forecast_date", { key: "forecastDateOld" });
    }
  }

  if (!has(m.publication_time)) {
    markBlock(result, "meta:publication_time", { key: "publicationTimeMissing" });
  }

  if (!has(m.data_sources)) {
    markBlock(result, "meta:data_sources", { key: "dataSourcesMissing" });
  }

  if (!has(m.national_forecast_text)) {
    markBlock(result, "meta:national_forecast_text", { key: "nationalForecastTextMissing" });
  }

  if (!has(m.forecaster_name)) {
    markBlock(result, "meta:forecaster_name", { key: "forecasterNameMissing" });
  }

  return result;
}

function validateNationalForecastStep(data: BulletinData): ValidationResult {
  const result = createResult();
  validateWeatherEntry({ scope: "national" }, "national", data.nationalForecast, result);
  return result;
}

function validateRegionForecastStep(data: BulletinData): ValidationResult {
  const result = createResult();
  REGIONS.forEach((region) => {
    validateWeatherEntry(
      { scope: "region", region },
      `region:${region}`,
      data.regionForecast[region],
      result
    );
  });
  return result;
}

function validateNationalHazardStep(data: BulletinData): ValidationResult {
  const result = createResult();
  const tmax = num(data.nationalForecast.temp_max_c);
  const rain = num(data.nationalForecast.rainfall_mm);
  const wspd = num(data.nationalForecast.wind_speed_kmh);

  HAZARDS.forEach((h) => {
    const hz = data.nationalHazard[h];
    const params = { hazard: h };

    validateRiskLevel(result, hz.risk_level, `nathazard:${h}:risk_level`, "nationalHazardRiskMissing", params);

    if (isHighOrVeryHigh(hz.risk_level) && !has(hz.comment)) {
      markBlock(result, `nathazard:${h}:comment`, {
        key: "nationalHazardCommentMissing",
        params: { hazard: h, level: hz.risk_level },
      });
    }

    if (
      h === "Heat wave" &&
      isHighOrVeryHigh(hz.risk_level) &&
      isNumeric(data.nationalForecast.temp_max_c) &&
      tmax < 32
    ) {
      result.warnings.push({ key: "heatWaveTempWarning" });
    }
    if (h === "Flood" && isHighOrVeryHigh(hz.risk_level) && isNumeric(data.nationalForecast.rainfall_mm) && rain < 10) {
      result.warnings.push({ key: "floodRainWarning" });
    }
    if (h === "Strong wind" && isHighOrVeryHigh(hz.risk_level) && isNumeric(data.nationalForecast.wind_speed_kmh) && wspd < 36) {
      result.warnings.push({ key: "windSpeedHazardWarning" });
    }
  });

  return result;
}

function validateRegionHazardStep(data: BulletinData): ValidationResult {
  const result = createResult();

  REGIONS.forEach((region) => {
    HAZARDS.forEach((h) => {
      const hz = data.regionHazard[region][h];
      const key = `regionhazard:${region}:${h}`;
      const base = { region, hazard: h };

      validateRiskLevel(result, hz.risk_level, `${key}:risk_level`, "regionHazardRiskMissing", base);

      if (isHighOrVeryHigh(hz.risk_level) && !has(hz.comment)) {
        markBlock(result, `${key}:comment`, {
          key: "regionHazardCommentMissing",
          params: { ...base, level: hz.risk_level },
        });
      }

      if (has(hz.risk_level) && hz.risk_level !== "None" && hz.affected_prefectures.length === 0) {
        markBlock(result, `${key}:affected_prefectures`, {
          key: "regionHazardPrefecturesMissing",
          params: { ...base, level: hz.risk_level },
        });
      }

      hz.affected_prefectures.forEach((prefecture) => {
        if (!isPrefectureInRegion(prefecture, region)) {
          markBlock(result, `${key}:affected_prefectures`, {
            key: "prefectureNotInRegion",
            params: { ...base, prefecture },
          });
        }
      });
    });
  });

  return result;
}

function validateInterpretationStep(data: BulletinData): ValidationResult {
  const result = createResult();

  if (!has(data.interpretation.general_situation)) {
    markBlock(result, "interp:general_situation", { key: "interpretationMissing" });
  } else if (data.interpretation.general_situation.length < 20) {
    markWarn(result, "interp:general_situation", { key: "interpretationShort" });
  }

  return result;
}

const STEP_VALIDATORS = [
  validateMetadataStep,
  validateNationalForecastStep,
  validateRegionForecastStep,
  validateNationalHazardStep,
  validateRegionHazardStep,
  validateInterpretationStep,
] as const;

export { type WizardStep } from "./types";

export function validateBulletinStep(data: BulletinData, step: WizardStep): ValidationResult {
  return STEP_VALIDATORS[step](data);
}

export function findFirstStepWithBlocking(data: BulletinData): WizardStep {
  for (let step = 0; step < WIZARD_STEP_COUNT; step += 1) {
    if (validateBulletinStep(data, step as WizardStep).blocking.length > 0) {
      return step as WizardStep;
    }
  }
  return 0;
}

export function validateBulletin(data: BulletinData): ValidationResult {
  return mergeResults(
    ...STEP_VALIDATORS.map((validate) => validate(data))
  );
}
