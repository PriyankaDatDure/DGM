"use client";

import type { WeatherFieldInput } from "@/lib/validation/weather-fields";
import { CONFIDENCE_LEVELS, WIND_DIRECTIONS } from "@/lib/bulletin/constants";

interface Props {
  values: WeatherFieldInput;
  onChange: (values: WeatherFieldInput) => void;
}

export default function WeatherFieldInputs({ values, onChange }: Props) {
  const set = (key: keyof WeatherFieldInput, value: string) =>
    onChange({ ...values, [key]: value });

  return (
    <div className="grid three">
      <div className="field">
        <label>Min temp (°C) *</label>
        <input type="number" step="0.1" value={values.temp_min_c} onChange={(e) => set("temp_min_c", e.target.value)} required />
      </div>
      <div className="field">
        <label>Max temp (°C) *</label>
        <input type="number" step="0.1" value={values.temp_max_c} onChange={(e) => set("temp_max_c", e.target.value)} required />
      </div>
      <div className="field">
        <label>Feels-like (°C) *</label>
        <input type="number" step="0.1" value={values.temp_ressentie_c} onChange={(e) => set("temp_ressentie_c", e.target.value)} required />
      </div>
      <div className="field">
        <label>Humidity (%) *</label>
        <input type="number" value={values.relative_humidity_pct} onChange={(e) => set("relative_humidity_pct", e.target.value)} required />
      </div>
      <div className="field">
        <label>Pressure (hPa)</label>
        <input type="number" value={values.pressure_hpa} onChange={(e) => set("pressure_hpa", e.target.value)} />
      </div>
      <div className="field">
        <label>Wind direction *</label>
        <select value={values.wind_direction} onChange={(e) => set("wind_direction", e.target.value)} required>
          <option value="">— Select —</option>
          {WIND_DIRECTIONS.map((direction) => (
            <option key={direction} value={direction}>{direction}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Wind speed (m/s) *</label>
        <input type="number" value={values.wind_speed_kmh} onChange={(e) => set("wind_speed_kmh", e.target.value)} required />
      </div>
      <div className="field">
        <label>Rainfall (mm) *</label>
        <input type="number" value={values.rainfall_mm} onChange={(e) => set("rainfall_mm", e.target.value)} required />
      </div>
      <div className="field">
        <label>Sunshine (%)</label>
        <input type="number" value={values.sunshine_pct} onChange={(e) => set("sunshine_pct", e.target.value)} />
      </div>
      <div className="field">
        <label>Confidence level</label>
        <select value={values.confidence} onChange={(e) => set("confidence", e.target.value)}>
          <option value="">— Select —</option>
          {CONFIDENCE_LEVELS.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>
      <div className="field full">
        <label>Comment</label>
        <textarea value={values.comment} onChange={(e) => set("comment", e.target.value)} />
      </div>
    </div>
  );
}

export { emptyWeatherFieldInput, rowToWeatherFieldInput } from "@/lib/validation/weather-fields";
