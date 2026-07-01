"use client";

import { WeatherEntry } from "@/lib/bulletin/types";
import WeatherFields from "@/components/bulletin/WeatherFields";

interface Props {
  data: WeatherEntry;
  onChange: (data: WeatherEntry) => void;
  fieldBlocking: Set<string>;
  fieldWarning: Set<string>;
}

export default function NationalForecastStep({ data, onChange, fieldBlocking, fieldWarning }: Props) {
  return (
    <div className="panel">
      <h2>National weather forecast</h2>
      <p className="desc">One set of values per daily bulletin, at country level.</p>
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
