import { BulletinData, ValidationMessage, ValidationResult, WeatherEntry, WizardStep } from "./types";
import { HAZARDS, REGIONS, RISK_LEVELS, WIND_DIRECTIONS, isPrefectureInRegion } from "./constants";
import { isStructuredValidityEndBeforeStart } from "./validity-period";

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

type WeatherScope = { scope: "national" } | { scope: "region"; region: string };

function validateWeatherEntry(
  weatherScope: WeatherScope,
  keyPrefix: string,
  w: WeatherEntry,
  blocking: ValidationMessage[],
  warnings: ValidationMessage[],
  fieldBlocking: Set<string>,
  fieldWarning: Set<string>
) {
  const scopeParam =
    weatherScope.scope === "national" ? "national" : `region:${weatherScope.region}`;
  const p = { scope: scopeParam };

  if (!has(w.temp_min_c)) {
    blocking.push({ key: "tempMinMissing", params: p });
    fieldBlocking.add(`${keyPrefix}:temp_min_c`);
  } else if (!isNumeric(w.temp_min_c)) {
    blocking.push({ key: "tempMinInvalid", params: p });
    fieldBlocking.add(`${keyPrefix}:temp_min_c`);
  }

  if (!has(w.temp_max_c)) {
    blocking.push({ key: "tempMaxMissing", params: p });
    fieldBlocking.add(`${keyPrefix}:temp_max_c`);
  } else if (!isNumeric(w.temp_max_c)) {
    blocking.push({ key: "tempMaxInvalid", params: p });
    fieldBlocking.add(`${keyPrefix}:temp_max_c`);
  }

  const tmin = num(w.temp_min_c);
  const tmax = num(w.temp_max_c);

  if (isNumeric(w.temp_min_c) && isNumeric(w.temp_max_c) && tmin > tmax) {
    blocking.push({ key: "tempMinHigherThanMax", params: p });
    fieldBlocking.add(`${keyPrefix}:temp_min_c`);
    fieldBlocking.add(`${keyPrefix}:temp_max_c`);
  }

  if (isNumeric(w.temp_min_c) && (tmin < 10 || tmin > 50)) {
    warnings.push({ key: "tempRangeWarning", params: p });
    fieldWarning.add(`${keyPrefix}:temp_min_c`);
  }
  if (isNumeric(w.temp_max_c) && (tmax < 10 || tmax > 50)) {
    warnings.push({ key: "tempRangeWarning", params: p });
    fieldWarning.add(`${keyPrefix}:temp_max_c`);
  }

  if (!has(w.temp_ressentie_c)) {
    blocking.push({ key: "feelsLikeMissing", params: p });
    fieldBlocking.add(`${keyPrefix}:temp_ressentie_c`);
  } else if (!isNumeric(w.temp_ressentie_c)) {
    blocking.push({ key: "feelsLikeInvalid", params: p });
    fieldBlocking.add(`${keyPrefix}:temp_ressentie_c`);
  } else {
    const tfeel = num(w.temp_ressentie_c);
    if (tfeel < 15 || tfeel > 60) {
      warnings.push({ key: "feelsLikeWarning", params: p });
      fieldWarning.add(`${keyPrefix}:temp_ressentie_c`);
    }
  }

  const hum = num(w.relative_humidity_pct);
  if (!has(w.relative_humidity_pct)) {
    blocking.push({ key: "humidityMissing", params: p });
    fieldBlocking.add(`${keyPrefix}:relative_humidity_pct`);
  } else if (!isNumeric(w.relative_humidity_pct) || hum < 0 || hum > 100) {
    blocking.push({ key: "humidityRangeError", params: p });
    fieldBlocking.add(`${keyPrefix}:relative_humidity_pct`);
  } else if (hum > 95 || hum < 20) {
    warnings.push({ key: "humidityWarning", params: p });
    fieldWarning.add(`${keyPrefix}:relative_humidity_pct`);
  }

  if (has(w.pressure_hpa)) {
    const pres = num(w.pressure_hpa);
    if (!isNumeric(w.pressure_hpa) || pres <= 0) {
      blocking.push({ key: "pressureError", params: p });
      fieldBlocking.add(`${keyPrefix}:pressure_hpa`);
    } else if (pres < 850 || pres > 1100) {
      warnings.push({ key: "pressureWarning", params: p });
      fieldWarning.add(`${keyPrefix}:pressure_hpa`);
    }
  }

  if (!has(w.wind_direction)) {
    blocking.push({ key: "windDirectionMissing", params: p });
    fieldBlocking.add(`${keyPrefix}:wind_direction`);
  } else if (!(WIND_DIRECTIONS as readonly string[]).includes(w.wind_direction)) {
    blocking.push({ key: "windDirectionInvalid", params: p });
    fieldBlocking.add(`${keyPrefix}:wind_direction`);
  }

  if (!has(w.wind_speed_kmh)) {
    blocking.push({ key: "windSpeedMissing", params: p });
    fieldBlocking.add(`${keyPrefix}:wind_speed_kmh`);
  } else if (!isNumeric(w.wind_speed_kmh)) {
    blocking.push({ key: "windSpeedInvalid", params: p });
    fieldBlocking.add(`${keyPrefix}:wind_speed_kmh`);
  } else {
    const wspd = num(w.wind_speed_kmh);
    if (wspd < 0) {
      blocking.push({ key: "windSpeedNegative", params: p });
      fieldBlocking.add(`${keyPrefix}:wind_speed_kmh`);
    } else if (wspd > 80) {
      warnings.push({ key: "windSpeedWarning", params: p });
      fieldWarning.add(`${keyPrefix}:wind_speed_kmh`);
    }
  }

  if (!has(w.rainfall_mm)) {
    blocking.push({ key: "rainfallMissing", params: p });
    fieldBlocking.add(`${keyPrefix}:rainfall_mm`);
  } else if (!isNumeric(w.rainfall_mm)) {
    blocking.push({ key: "rainfallInvalid", params: p });
    fieldBlocking.add(`${keyPrefix}:rainfall_mm`);
  } else {
    const rain = num(w.rainfall_mm);
    if (rain < 0) {
      blocking.push({ key: "rainfallNegative", params: p });
      fieldBlocking.add(`${keyPrefix}:rainfall_mm`);
    } else if (rain > 100) {
      warnings.push({ key: "rainfallWarning", params: p });
      fieldWarning.add(`${keyPrefix}:rainfall_mm`);
    }
  }

  if (has(w.sunshine_pct)) {
    const sun = num(w.sunshine_pct);
    if (!isNumeric(w.sunshine_pct) || sun < 0 || sun > 100) {
      blocking.push({ key: "sunshineRangeError", params: p });
      fieldBlocking.add(`${keyPrefix}:sunshine_pct`);
    }
  }
}

function validateRiskLevel(
  riskLevel: string,
  fieldKey: string,
  blocking: ValidationMessage[],
  fieldBlocking: Set<string>,
  messageKey: string,
  params?: Record<string, string>
) {
  if (!has(riskLevel)) {
    blocking.push({ key: messageKey, params });
    fieldBlocking.add(fieldKey);
  } else if (!RISK_LEVELS.includes(riskLevel as (typeof RISK_LEVELS)[number])) {
    blocking.push({ key: "riskLevelInvalid", params });
    fieldBlocking.add(fieldKey);
  }
}

function createResult(): ValidationResult {
  return {
    blocking: [],
    warnings: [],
    fieldBlocking: new Set<string>(),
    fieldWarning: new Set<string>(),
  };
}

function mergeResults(...parts: ValidationResult[]): ValidationResult {
  const merged = createResult();
  for (const part of parts) {
    merged.blocking.push(...part.blocking);
    merged.warnings.push(...part.warnings);
    part.fieldBlocking.forEach((key) => merged.fieldBlocking.add(key));
    part.fieldWarning.forEach((key) => merged.fieldWarning.add(key));
  }
  return merged;
}

export const WIZARD_STEP_COUNT = 6;

function validateMetadataStep(data: BulletinData): ValidationResult {
  const result = createResult();
  const { blocking, warnings, fieldBlocking, fieldWarning } = result;
  const m = data.metadata;

  if (!has(m.forecast_date)) {
    blocking.push({ key: "forecastDateMissing" });
    fieldBlocking.add("meta:forecast_date");
  } else {
    const days = (Date.now() - new Date(m.forecast_date).getTime()) / 86400000;
    if (days > 2) {
      warnings.push({ key: "forecastDateOld" });
      fieldWarning.add("meta:forecast_date");
    }
  }

  if (!has(m.publication_time)) {
    blocking.push({ key: "publicationTimeMissing" });
    fieldBlocking.add("meta:publication_time");
  }

  const validityMissing =
    !has(m.validity_date) || !has(m.validity_start_time) || !has(m.validity_end_time);
  if (!has(m.validity_date)) fieldBlocking.add("meta:validity_date");
  if (!has(m.validity_start_time)) fieldBlocking.add("meta:validity_start_time");
  if (!has(m.validity_end_time)) fieldBlocking.add("meta:validity_end_time");
  if (validityMissing) {
    blocking.push({ key: "validityPeriodMissing" });
  } else if (
    isStructuredValidityEndBeforeStart(m.validity_date, m.validity_start_time, m.validity_end_time)
  ) {
    blocking.push({ key: "validityPeriodInconsistent" });
    fieldBlocking.add("meta:validity_end_time");
  }

  if (!has(m.data_sources)) {
    blocking.push({ key: "dataSourcesMissing" });
    fieldBlocking.add("meta:data_sources");
  }

  if (!has(m.national_forecast_text)) {
    blocking.push({ key: "nationalForecastTextMissing" });
    fieldBlocking.add("meta:national_forecast_text");
  }

  if (!has(m.submission_status)) {
    blocking.push({ key: "submissionStatusMissing" });
    fieldBlocking.add("meta:submission_status");
  }

  if (!has(m.forecaster_name)) {
    blocking.push({ key: "forecasterNameMissing" });
    fieldBlocking.add("meta:forecaster_name");
  }

  return result;
}

function validateNationalForecastStep(data: BulletinData): ValidationResult {
  const result = createResult();
  validateWeatherEntry(
    { scope: "national" },
    "national",
    data.nationalForecast,
    result.blocking,
    result.warnings,
    result.fieldBlocking,
    result.fieldWarning
  );
  return result;
}

function validateRegionForecastStep(data: BulletinData): ValidationResult {
  const result = createResult();
  REGIONS.forEach((region) => {
    validateWeatherEntry(
      { scope: "region", region },
      `region:${region}`,
      data.regionForecast[region],
      result.blocking,
      result.warnings,
      result.fieldBlocking,
      result.fieldWarning
    );
  });
  return result;
}

function validateNationalHazardStep(data: BulletinData): ValidationResult {
  const result = createResult();
  const { blocking, warnings, fieldBlocking, fieldWarning } = result;
  const tmax = num(data.nationalForecast.temp_max_c);
  const tfeel = num(data.nationalForecast.temp_ressentie_c);
  const rain = num(data.nationalForecast.rainfall_mm);
  const wspd = num(data.nationalForecast.wind_speed_kmh);

  HAZARDS.forEach((h) => {
    const hz = data.nationalHazard[h];
    const params = { hazard: h };

    validateRiskLevel(
      hz.risk_level,
      `nathazard:${h}:risk_level`,
      blocking,
      fieldBlocking,
      "nationalHazardRiskMissing",
      params
    );

    if (isHighOrVeryHigh(hz.risk_level) && !has(hz.comment)) {
      blocking.push({
        key: "nationalHazardCommentMissing",
        params: { hazard: h, level: hz.risk_level },
      });
      fieldBlocking.add(`nathazard:${h}:comment`);
    }

    if (
      h === "Heat wave" &&
      isHighOrVeryHigh(hz.risk_level) &&
      ((isNumeric(data.nationalForecast.temp_max_c) && tmax < 32) ||
        (isNumeric(data.nationalForecast.temp_ressentie_c) && tfeel < 32))
    ) {
      warnings.push({ key: "heatWaveTempWarning" });
    }
    if (h === "Flood" && isHighOrVeryHigh(hz.risk_level) && isNumeric(data.nationalForecast.rainfall_mm) && rain < 10) {
      warnings.push({ key: "floodRainWarning" });
    }
    if (h === "Strong wind" && isHighOrVeryHigh(hz.risk_level) && isNumeric(data.nationalForecast.wind_speed_kmh) && wspd < 40) {
      warnings.push({ key: "windSpeedHazardWarning" });
    }
  });

  return result;
}

function validateRegionHazardStep(data: BulletinData): ValidationResult {
  const result = createResult();
  const { blocking, warnings, fieldBlocking, fieldWarning } = result;

  REGIONS.forEach((region) => {
    HAZARDS.forEach((h) => {
      const hz = data.regionHazard[region][h];
      const key = `regionhazard:${region}:${h}`;
      const base = { region, hazard: h };

      validateRiskLevel(
        hz.risk_level,
        `${key}:risk_level`,
        blocking,
        fieldBlocking,
        "regionHazardRiskMissing",
        base
      );

      if (isHighOrVeryHigh(hz.risk_level) && !has(hz.comment)) {
        blocking.push({
          key: "regionHazardCommentMissing",
          params: { ...base, level: hz.risk_level },
        });
        fieldBlocking.add(`${key}:comment`);
      }

      if (has(hz.risk_level) && hz.risk_level !== "None" && hz.affected_prefectures.length === 0) {
        blocking.push({
          key: "regionHazardPrefecturesMissing",
          params: { ...base, level: hz.risk_level },
        });
        fieldBlocking.add(`${key}:affected_prefectures`);
      }

      hz.affected_prefectures.forEach((prefecture) => {
        if (!isPrefectureInRegion(prefecture, region)) {
          blocking.push({
            key: "prefectureNotInRegion",
            params: { ...base, prefecture },
          });
          fieldBlocking.add(`${key}:affected_prefectures`);
        }
      });

      if (
        hz.affected_prefectures.length === 0 &&
        (hz.risk_level === "None" || !has(hz.risk_level))
      ) {
        warnings.push({ key: "regionHazardPrefecturesEmptyWarning", params: base });
        fieldWarning.add(`${key}:affected_prefectures`);
      }
    });
  });

  return result;
}

function validateInterpretationStep(data: BulletinData): ValidationResult {
  const result = createResult();
  const { blocking, warnings, fieldBlocking, fieldWarning } = result;

  if (!has(data.interpretation.general_situation)) {
    blocking.push({ key: "interpretationMissing" });
    fieldBlocking.add("interp:general_situation");
  } else if (data.interpretation.general_situation.length < 20) {
    warnings.push({ key: "interpretationShort" });
    fieldWarning.add("interp:general_situation");
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
