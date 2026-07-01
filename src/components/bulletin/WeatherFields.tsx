"use client";

import { WeatherEntry } from "@/lib/bulletin/types";
import { WIND_DIRECTIONS, CONFIDENCE_LEVELS } from "@/lib/bulletin/constants";
import Field from "@/components/bulletin/Field";

interface Props {
  data: WeatherEntry;
  onChange: (data: WeatherEntry) => void;
  fieldKeyPrefix: string;
  fieldBlocking: Set<string>;
  fieldWarning: Set<string>;
}

export default function WeatherFields({ data, onChange, fieldKeyPrefix, fieldBlocking, fieldWarning }: Props) {
  const set = (key: keyof WeatherEntry, value: string) => onChange({ ...data, [key]: value });
  const k = (suffix: string) => `${fieldKeyPrefix}:${suffix}`;

  return (
    <div className="grid three">
      <Field label="Minimum temperature (°C)" required fieldKey={k("temp_min_c")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg="Minimum temperature must be a numeric value.">
        <input type="number" step="0.1" value={data.temp_min_c} onChange={(e) => set("temp_min_c", e.target.value)} />
      </Field>

      <Field label="Maximum temperature (°C)" required fieldKey={k("temp_max_c")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg="Maximum must be numeric and not lower than minimum." warnMsg="Temperature looks unusual (expected 10–50°C).">
        <input type="number" step="0.1" value={data.temp_max_c} onChange={(e) => set("temp_max_c", e.target.value)} />
      </Field>

      <Field label="Feels-like temperature (°C)" required fieldKey={k("temp_ressentie_c")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg="Feels-like temperature must be a numeric value." warnMsg="Feels-like temperature looks unusual (expected 15–60°C).">
        <input type="number" step="0.1" value={data.temp_ressentie_c} onChange={(e) => set("temp_ressentie_c", e.target.value)} />
      </Field>

      <Field label="Relative humidity (%)" required fieldKey={k("relative_humidity_pct")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg="Relative humidity must be between 0% and 100%." warnMsg="Humidity value looks unusual.">
        <input type="number" value={data.relative_humidity_pct} onChange={(e) => set("relative_humidity_pct", e.target.value)} />
      </Field>

      <Field label="Atmospheric pressure (hPa)" optional fieldKey={k("pressure_hpa")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg="Pressure must be a positive numeric value." warnMsg="Pressure value looks unusual (expected 850–1100 hPa).">
        <input type="number" value={data.pressure_hpa} onChange={(e) => set("pressure_hpa", e.target.value)} />
      </Field>

      <Field label="Wind direction" required fieldKey={k("wind_direction")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg="Please select a valid wind direction.">
        <select value={data.wind_direction} onChange={(e) => set("wind_direction", e.target.value)}>
          <option value="">— Select —</option>
          {WIND_DIRECTIONS.map((w) => <option key={w}>{w}</option>)}
        </select>
      </Field>

      <Field label="Wind speed (km/h)" required fieldKey={k("wind_speed_kmh")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg="Wind speed must be numeric and ≥ 0." warnMsg="Wind speed looks high (above 80 km/h).">
        <input type="number" value={data.wind_speed_kmh} onChange={(e) => set("wind_speed_kmh", e.target.value)} />
      </Field>

      <Field label="Rainfall (mm)" required fieldKey={k("rainfall_mm")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg="Rainfall must be numeric and ≥ 0." warnMsg="Rainfall looks very high (above 100mm).">
        <input type="number" value={data.rainfall_mm} onChange={(e) => set("rainfall_mm", e.target.value)} />
      </Field>

      <Field label="Sunshine (%)" optional fieldKey={k("sunshine_pct")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg="Sunshine must be between 0% and 100%.">
        <input type="number" value={data.sunshine_pct} onChange={(e) => set("sunshine_pct", e.target.value)} />
      </Field>

      <Field label="Confidence level" fieldKey={k("confidence")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
        <select value={data.confidence} onChange={(e) => set("confidence", e.target.value)}>
          <option value="">— Select —</option>
          {CONFIDENCE_LEVELS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>

      <Field label="Comment" optional full fieldKey={k("comment")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
        <textarea value={data.comment} onChange={(e) => set("comment", e.target.value)} />
      </Field>
    </div>
  );
}
