"use client";

import { useTranslations } from "next-intl";
import { WeatherEntry } from "@/lib/bulletin/types";
import { WIND_DIRECTIONS, CONFIDENCE_LEVELS } from "@/lib/bulletin/constants";
import { useEnumLabels } from "@/lib/i18n/use-enum-labels";
import Field from "@/components/bulletin/Field";

interface Props {
  data: WeatherEntry;
  onChange: (data: WeatherEntry) => void;
  fieldKeyPrefix: string;
  fieldBlocking: Set<string>;
  fieldWarning: Set<string>;
}

export default function WeatherFields({ data, onChange, fieldKeyPrefix, fieldBlocking, fieldWarning }: Props) {
  const t = useTranslations("form.weather");
  const tCommon = useTranslations("common");
  const { windDirection, confidence } = useEnumLabels();
  const set = (key: keyof WeatherEntry, value: string) => onChange({ ...data, [key]: value });
  const k = (suffix: string) => `${fieldKeyPrefix}:${suffix}`;

  return (
    <div className="grid three">
      <Field label={t("tempMin")} required fieldKey={k("temp_min_c")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg={t("tempMinError")}>
        <input type="number" step="0.1" value={data.temp_min_c} onChange={(e) => set("temp_min_c", e.target.value)} />
      </Field>

      <Field label={t("tempMax")} required fieldKey={k("temp_max_c")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg={t("tempMaxError")} warnMsg={t("tempMaxWarn")}>
        <input type="number" step="0.1" value={data.temp_max_c} onChange={(e) => set("temp_max_c", e.target.value)} />
      </Field>

      <Field label={t("feelsLike")} required fieldKey={k("temp_ressentie_c")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg={t("feelsLikeError")} warnMsg={t("feelsLikeWarn")}>
        <input type="number" step="0.1" value={data.temp_ressentie_c} onChange={(e) => set("temp_ressentie_c", e.target.value)} />
      </Field>

      <Field label={t("humidity")} required fieldKey={k("relative_humidity_pct")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg={t("humidityError")} warnMsg={t("humidityWarn")}>
        <input type="number" value={data.relative_humidity_pct} onChange={(e) => set("relative_humidity_pct", e.target.value)} />
      </Field>

      <Field label={t("pressure")} optional fieldKey={k("pressure_hpa")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg={t("pressureError")} warnMsg={t("pressureWarn")}>
        <input type="number" value={data.pressure_hpa} onChange={(e) => set("pressure_hpa", e.target.value)} />
      </Field>

      <Field label={t("windDirection")} required fieldKey={k("wind_direction")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg={t("windDirectionError")}>
        <select value={data.wind_direction} onChange={(e) => set("wind_direction", e.target.value)}>
          <option value="">{tCommon("select")}</option>
          {WIND_DIRECTIONS.map((w) => (
            <option key={w} value={w}>{windDirection(w)}</option>
          ))}
        </select>
      </Field>

      <Field label={t("windSpeed")} required fieldKey={k("wind_speed_kmh")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg={t("windSpeedError")} warnMsg={t("windSpeedWarn")}>
        <input type="number" value={data.wind_speed_kmh} onChange={(e) => set("wind_speed_kmh", e.target.value)} />
      </Field>

      <Field label={t("rainfall")} required fieldKey={k("rainfall_mm")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg={t("rainfallError")} warnMsg={t("rainfallWarn")}>
        <input type="number" value={data.rainfall_mm} onChange={(e) => set("rainfall_mm", e.target.value)} />
      </Field>

      <Field label={t("sunshine")} optional fieldKey={k("sunshine_pct")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg={t("sunshineError")}>
        <input type="number" value={data.sunshine_pct} onChange={(e) => set("sunshine_pct", e.target.value)} />
      </Field>

      <Field label={t("confidence")} fieldKey={k("confidence")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
        <select value={data.confidence} onChange={(e) => set("confidence", e.target.value)}>
          <option value="">{tCommon("select")}</option>
          {CONFIDENCE_LEVELS.map((c) => (
            <option key={c} value={c}>{confidence(c)}</option>
          ))}
        </select>
      </Field>

      <Field label={t("comment")} optional full fieldKey={k("comment")} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
        <textarea value={data.comment} onChange={(e) => set("comment", e.target.value)} />
      </Field>
    </div>
  );
}
