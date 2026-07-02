"use client";

import { useTranslations } from "next-intl";
import { WeatherEntry } from "@/lib/bulletin/types";
import WeatherFields from "@/components/bulletin/WeatherFields";

interface Props {
  data: WeatherEntry;
  onChange: (data: WeatherEntry) => void;
  fieldBlocking: Set<string>;
  fieldWarning: Set<string>;
}

export default function NationalForecastStep({ data, onChange, fieldBlocking, fieldWarning }: Props) {
  const t = useTranslations("form.nationalForecast");

  return (
    <div className="panel">
      <h2>{t("title")}</h2>
      <p className="desc">{t("desc")}</p>
      <WeatherFields
        data={data}
        onChange={onChange}
        fieldKeyPrefix="national"
        fieldBlocking={fieldBlocking}
        fieldWarning={fieldWarning}
      />
    </div>
  );
}
