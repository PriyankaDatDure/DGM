"use client";

import { useTranslations } from "next-intl";
import { RegionCode, WeatherEntry } from "@/lib/bulletin/types";
import { REGIONS, WIND_DIRECTIONS, CONFIDENCE_LEVELS, regionDisplayLabel } from "@/lib/bulletin/constants";
import { useEnumLabels } from "@/lib/i18n/use-enum-labels";

interface Props {
  data: Record<RegionCode, WeatherEntry>;
  onChange: (region: RegionCode, data: WeatherEntry) => void;
  fieldBlocking: Set<string>;
  fieldWarning: Set<string>;
}

function cellClass(
  fieldKey: string,
  fieldBlocking: Set<string>,
  fieldWarning: Set<string>
): string {
  if (fieldBlocking.has(fieldKey)) return "cell-err";
  if (fieldWarning.has(fieldKey)) return "cell-warn";
  return "";
}

export default function RegionForecastStep({ data, onChange, fieldBlocking, fieldWarning }: Props) {
  const t = useTranslations("form.regionForecast");
  const tCommon = useTranslations("common");
  const { windDirection, confidence } = useEnumLabels();

  const setField = (region: RegionCode, key: keyof WeatherEntry, value: string) => {
    onChange(region, { ...data[region], [key]: value });
  };

  const fk = (region: RegionCode, suffix: string) => `region:${region}:${suffix}`;

  return (
    <div className="panel">
      <h2>{t("title")}</h2>
      <p className="desc">{t("desc")}</p>
      <div className="table-wrap forecast-table-wrap">
        <table className="forecast-table">
          <thead>
            <tr>
              <th>{t("region")}</th>
              <th>{t("minTemp")}</th>
              <th>{t("maxTemp")}</th>
              <th>{t("feelsLike")}</th>
              <th>{t("humidity")}</th>
              <th>{t("pressure")}</th>
              <th>{t("windDir")}</th>
              <th>{t("windSpeed")}</th>
              <th>{t("rainfall")}</th>
              <th>{t("sunshine")}</th>
              <th>{t("confidence")}</th>
            </tr>
          </thead>
          <tbody>
            {REGIONS.map((region) => {
              const row = data[region];
              return (
                <tr key={region}>
                  <td className="region">{regionDisplayLabel(region)}</td>
                  <td className={cellClass(fk(region, "temp_min_c"), fieldBlocking, fieldWarning)}>
                    <input type="number" step="0.1" value={row.temp_min_c} onChange={(e) => setField(region, "temp_min_c", e.target.value)} />
                  </td>
                  <td className={cellClass(fk(region, "temp_max_c"), fieldBlocking, fieldWarning)}>
                    <input type="number" step="0.1" value={row.temp_max_c} onChange={(e) => setField(region, "temp_max_c", e.target.value)} />
                  </td>
                  <td className={cellClass(fk(region, "temp_ressentie_c"), fieldBlocking, fieldWarning)}>
                    <input type="number" step="0.1" value={row.temp_ressentie_c} onChange={(e) => setField(region, "temp_ressentie_c", e.target.value)} />
                  </td>
                  <td className={cellClass(fk(region, "relative_humidity_pct"), fieldBlocking, fieldWarning)}>
                    <input type="number" value={row.relative_humidity_pct} onChange={(e) => setField(region, "relative_humidity_pct", e.target.value)} />
                  </td>
                  <td className={cellClass(fk(region, "pressure_hpa"), fieldBlocking, fieldWarning)}>
                    <input type="number" value={row.pressure_hpa} onChange={(e) => setField(region, "pressure_hpa", e.target.value)} />
                  </td>
                  <td className={cellClass(fk(region, "wind_direction"), fieldBlocking, fieldWarning)}>
                    <select value={row.wind_direction} onChange={(e) => setField(region, "wind_direction", e.target.value)}>
                      <option value="">{tCommon("select")}</option>
                      {WIND_DIRECTIONS.map((w) => (
                        <option key={w} value={w}>{windDirection(w)}</option>
                      ))}
                    </select>
                  </td>
                  <td className={cellClass(fk(region, "wind_speed_kmh"), fieldBlocking, fieldWarning)}>
                    <input type="number" value={row.wind_speed_kmh} onChange={(e) => setField(region, "wind_speed_kmh", e.target.value)} />
                  </td>
                  <td className={cellClass(fk(region, "rainfall_mm"), fieldBlocking, fieldWarning)}>
                    <input type="number" value={row.rainfall_mm} onChange={(e) => setField(region, "rainfall_mm", e.target.value)} />
                  </td>
                  <td className={cellClass(fk(region, "sunshine_pct"), fieldBlocking, fieldWarning)}>
                    <input type="number" value={row.sunshine_pct} onChange={(e) => setField(region, "sunshine_pct", e.target.value)} />
                  </td>
                  <td className={cellClass(fk(region, "confidence"), fieldBlocking, fieldWarning)}>
                    <select value={row.confidence} onChange={(e) => setField(region, "confidence", e.target.value)}>
                      <option value="">{tCommon("select")}</option>
                      {CONFIDENCE_LEVELS.map((c) => (
                        <option key={c} value={c}>{confidence(c)}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="hint" style={{ marginTop: 10 }}>{t("mandatoryHint")}</div>
    </div>
  );
}
