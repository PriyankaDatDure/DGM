import { BulletinData, ValidationResult, WeatherEntry } from "./types";
import { HAZARDS, REGIONS, isPrefectureInRegion, regionDisplayLabel } from "./constants";

const num = (v: string): number => parseFloat(v);
const has = (v: string | undefined): boolean => v !== undefined && v.trim() !== "";

function validateWeatherEntry(
  label: string,
  keyPrefix: string,
  w: WeatherEntry,
  blocking: string[],
  warnings: string[],
  fieldBlocking: Set<string>,
  fieldWarning: Set<string>
) {
  const tmin = num(w.temp_min_c);
  const tmax = num(w.temp_max_c);
  const tfeel = num(w.temp_ressentie_c);

  if (!has(w.temp_min_c)) { blocking.push(`${label}: minimum temperature is missing.`); fieldBlocking.add(`${keyPrefix}:temp_min_c`); }
  if (!has(w.temp_max_c)) { blocking.push(`${label}: maximum temperature is missing.`); fieldBlocking.add(`${keyPrefix}:temp_max_c`); }
  if (!isNaN(tmin) && !isNaN(tmax) && tmin > tmax) {
    blocking.push(`${label}: minimum temperature is higher than maximum temperature.`);
    fieldBlocking.add(`${keyPrefix}:temp_max_c`);
  }
  // Revised range: 10-50°C (was 10-45°C in the original template)
  if (!isNaN(tmax) && (tmax < 10 || tmax > 50)) {
    warnings.push(`${label}: temperature value looks unusual (expected 10–50°C).`);
    fieldWarning.add(`${keyPrefix}:temp_max_c`);
  }
  if (!has(w.temp_ressentie_c)) {
    blocking.push(`${label}: feels-like temperature is missing.`);
    fieldBlocking.add(`${keyPrefix}:temp_ressentie_c`);
  } else if (!isNaN(tfeel) && (tfeel < 15 || tfeel > 60)) {
    warnings.push(`${label}: feels-like temperature looks unusual (expected 15–60°C).`);
    fieldWarning.add(`${keyPrefix}:temp_ressentie_c`);
  }

  const hum = num(w.relative_humidity_pct);
  if (!has(w.relative_humidity_pct)) {
    blocking.push(`${label}: relative humidity is missing.`);
    fieldBlocking.add(`${keyPrefix}:relative_humidity_pct`);
  } else if (hum < 0 || hum > 100) {
    blocking.push(`${label}: relative humidity must be between 0% and 100%.`);
    fieldBlocking.add(`${keyPrefix}:relative_humidity_pct`);
  } else if (hum > 95 || hum < 20) {
    warnings.push(`${label}: humidity value looks unusual.`);
    fieldWarning.add(`${keyPrefix}:relative_humidity_pct`);
  }

  if (has(w.pressure_hpa)) {
    const pres = num(w.pressure_hpa);
    if (isNaN(pres) || pres <= 0) {
      blocking.push(`${label}: atmospheric pressure must be a positive numeric value.`);
      fieldBlocking.add(`${keyPrefix}:pressure_hpa`);
    } else if (pres < 850 || pres > 1100) {
      warnings.push(`${label}: atmospheric pressure value looks unusual (expected 850–1100 hPa).`);
      fieldWarning.add(`${keyPrefix}:pressure_hpa`);
    }
  }

  if (!has(w.wind_direction)) {
    blocking.push(`${label}: wind direction is missing.`);
    fieldBlocking.add(`${keyPrefix}:wind_direction`);
  }

  const wspd = num(w.wind_speed_kmh);
  if (!has(w.wind_speed_kmh)) {
    blocking.push(`${label}: wind speed is missing.`);
    fieldBlocking.add(`${keyPrefix}:wind_speed_kmh`);
  } else if (wspd < 0) {
    blocking.push(`${label}: wind speed must be ≥ 0.`);
    fieldBlocking.add(`${keyPrefix}:wind_speed_kmh`);
  } else if (wspd > 80) {
    warnings.push(`${label}: wind speed looks high (above 80 km/h).`);
    fieldWarning.add(`${keyPrefix}:wind_speed_kmh`);
  }

  const rain = num(w.rainfall_mm);
  if (!has(w.rainfall_mm)) {
    blocking.push(`${label}: rainfall is missing.`);
    fieldBlocking.add(`${keyPrefix}:rainfall_mm`);
  } else if (rain < 0) {
    blocking.push(`${label}: rainfall must be ≥ 0.`);
    fieldBlocking.add(`${keyPrefix}:rainfall_mm`);
  } else if (rain > 100) {
    warnings.push(`${label}: rainfall looks very high (above 100mm).`);
    fieldWarning.add(`${keyPrefix}:rainfall_mm`);
  }

  if (has(w.sunshine_pct)) {
    const sun = num(w.sunshine_pct);
    if (isNaN(sun) || sun < 0 || sun > 100) {
      blocking.push(`${label}: sunshine must be between 0% and 100%.`);
      fieldBlocking.add(`${keyPrefix}:sunshine_pct`);
    }
  }
}

export function validateBulletin(data: BulletinData): ValidationResult {
  const blocking: string[] = [];
  const warnings: string[] = [];
  const fieldBlocking = new Set<string>();
  const fieldWarning = new Set<string>();

  const m = data.metadata;
  if (!has(m.forecast_date)) { blocking.push("Forecast date is missing."); fieldBlocking.add("meta:forecast_date"); }
  else {
    const days = (Date.now() - new Date(m.forecast_date).getTime()) / 86400000;
    if (days > 2) { warnings.push("Forecast date is more than 2 days in the past."); fieldWarning.add("meta:forecast_date"); }
  }
  if (!has(m.publication_time)) { blocking.push("Publication time is missing."); fieldBlocking.add("meta:publication_time"); }
  if (!has(m.validity_period)) { blocking.push("Validity period is missing."); fieldBlocking.add("meta:validity_period"); }
  if (!has(m.submission_status)) { blocking.push("Submission status is missing."); fieldBlocking.add("meta:submission_status"); }
  if (!has(m.forecaster_name)) { blocking.push("Forecaster name is missing."); fieldBlocking.add("meta:forecaster_name"); }

  validateWeatherEntry("National forecast", "national", data.nationalForecast, blocking, warnings, fieldBlocking, fieldWarning);

  REGIONS.forEach((region) => {
    validateWeatherEntry(`Region ${region}`, `region:${region}`, data.regionForecast[region], blocking, warnings, fieldBlocking, fieldWarning);
  });

  const tmax = num(data.nationalForecast.temp_max_c);
  const rain = num(data.nationalForecast.rainfall_mm);
  const wspd = num(data.nationalForecast.wind_speed_kmh);

  HAZARDS.forEach((h) => {
    const hz = data.nationalHazard[h];
    if (!has(hz.risk_level)) {
      blocking.push(`National hazard "${h}": risk level is missing.`);
      fieldBlocking.add(`nathazard:${h}:risk_level`);
    }
    if ((hz.risk_level === "High" || hz.risk_level === "Very High") && !has(hz.comment)) {
      blocking.push(`National hazard "${h}" is ${hz.risk_level} but has no comment.`);
      fieldBlocking.add(`nathazard:${h}:comment`);
    }
    if (h === "Heat wave" && (hz.risk_level === "High" || hz.risk_level === "Very High") && !isNaN(tmax) && tmax < 32) {
      warnings.push("Heat wave risk is High/Very High but max/feels-like temperature looks low — please confirm.");
    }
    if (h === "Flood" && (hz.risk_level === "High" || hz.risk_level === "Very High") && !isNaN(rain) && rain < 10) {
      warnings.push("Flood risk is High/Very High but rainfall looks low — please confirm.");
    }
    if (h === "Strong wind" && (hz.risk_level === "High" || hz.risk_level === "Very High") && !isNaN(wspd) && wspd < 40) {
      warnings.push("Strong wind risk is High/Very High but wind speed looks low — please confirm.");
    }
  });

  REGIONS.forEach((region) => {
    const regionLabel = regionDisplayLabel(region);
    HAZARDS.forEach((h) => {
      const hz = data.regionHazard[region][h];
      const key = `regionhazard:${region}:${h}`;
      if (!has(hz.risk_level)) {
        blocking.push(`${regionLabel} / ${h}: risk level is missing.`);
        fieldBlocking.add(`${key}:risk_level`);
      }
      if ((hz.risk_level === "High" || hz.risk_level === "Very High") && !has(hz.comment)) {
        blocking.push(`${regionLabel} / ${h} is ${hz.risk_level} but has no comment.`);
        fieldBlocking.add(`${key}:comment`);
      }
      // New rule in the revised template: affected prefectures required unless risk is None.
      if (has(hz.risk_level) && hz.risk_level !== "None" && hz.affected_prefectures.length === 0) {
        blocking.push(`${regionLabel} / ${h} is "${hz.risk_level}" but no affected prefectures were entered.`);
        fieldBlocking.add(`${key}:affected_prefectures`);
      }
      hz.affected_prefectures.forEach((prefecture) => {
        if (!isPrefectureInRegion(prefecture, region)) {
          blocking.push(
            `${regionLabel} / ${h}: "${prefecture}" is not a prefecture in ${regionLabel}.`
          );
          fieldBlocking.add(`${key}:affected_prefectures`);
        }
      });
      // Soft check from the revised template: nudge if left empty with no risk level chosen yet.
      if (!has(hz.risk_level) && hz.affected_prefectures.length === 0) {
        warnings.push(`${regionLabel} / ${h}: affected prefectures are empty — confirm the risk level is "None" if that's intended.`);
        fieldWarning.add(`${key}:affected_prefectures`);
      }
    });
  });

  if (!has(data.interpretation.general_situation)) {
    blocking.push("National meteorological interpretation (general situation) is missing.");
    fieldBlocking.add("interp:general_situation");
  } else if (data.interpretation.general_situation.length < 20) {
    warnings.push("National interpretation text seems very short.");
    fieldWarning.add("interp:general_situation");
  }

  return { blocking, warnings, fieldBlocking, fieldWarning };
}
