"use client";

import { RegionCode, WeatherEntry } from "@/lib/bulletin/types";
import { REGIONS, WIND_DIRECTIONS, CONFIDENCE_LEVELS, regionDisplayLabel } from "@/lib/bulletin/constants";

interface Props {
  data: Record<RegionCode, WeatherEntry>;
  onChange: (region: RegionCode, data: WeatherEntry) => void;
}

export default function RegionForecastStep({ data, onChange }: Props) {
  const setField = (region: RegionCode, key: keyof WeatherEntry, value: string) => {
    onChange(region, { ...data[region], [key]: value });
  };

  return (
    <div className="panel">
      <h2>Weather forecast by region</h2>
      <p className="desc">
        One row per administrative region. Health region codes are shown in brackets.
      </p>
      <div className="table-wrap forecast-table-wrap">
        <table className="forecast-table">
          <thead>
            <tr>
              <th>Region</th><th>Min °C</th><th>Max °C</th><th>Feels-like °C</th><th>Humidity %</th>
              <th>Pressure hPa</th><th>Wind dir.</th><th>Wind km/h</th><th>Rain mm</th><th>Sun %</th><th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {REGIONS.map((region) => {
              const row = data[region];
              return (
                <tr key={region}>
                  <td className="region">{regionDisplayLabel(region)}</td>
                  <td><input type="number" step="0.1" value={row.temp_min_c} onChange={(e) => setField(region, "temp_min_c", e.target.value)} /></td>
                  <td><input type="number" step="0.1" value={row.temp_max_c} onChange={(e) => setField(region, "temp_max_c", e.target.value)} /></td>
                  <td><input type="number" step="0.1" value={row.temp_ressentie_c} onChange={(e) => setField(region, "temp_ressentie_c", e.target.value)} /></td>
                  <td><input type="number" value={row.relative_humidity_pct} onChange={(e) => setField(region, "relative_humidity_pct", e.target.value)} /></td>
                  <td><input type="number" value={row.pressure_hpa} onChange={(e) => setField(region, "pressure_hpa", e.target.value)} /></td>
                  <td>
                    <select value={row.wind_direction} onChange={(e) => setField(region, "wind_direction", e.target.value)}>
                      <option value="">—</option>
                      {WIND_DIRECTIONS.map((w) => <option key={w}>{w}</option>)}
                    </select>
                  </td>
                  <td><input type="number" value={row.wind_speed_kmh} onChange={(e) => setField(region, "wind_speed_kmh", e.target.value)} /></td>
                  <td><input type="number" value={row.rainfall_mm} onChange={(e) => setField(region, "rainfall_mm", e.target.value)} /></td>
                  <td><input type="number" value={row.sunshine_pct} onChange={(e) => setField(region, "sunshine_pct", e.target.value)} /></td>
                  <td>
                    <select value={row.confidence} onChange={(e) => setField(region, "confidence", e.target.value)}>
                      <option value="">—</option>
                      {CONFIDENCE_LEVELS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="hint" style={{ marginTop: 10 }}>
        Mandatory per region: Min °C, Max °C, Feels-like °C, Humidity, Wind direction, Wind speed, Rainfall.
        Pressure and Sunshine are optional.
      </div>
    </div>
  );
}
