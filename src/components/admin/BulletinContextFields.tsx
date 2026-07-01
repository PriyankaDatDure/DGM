"use client";

import type { BulletinContextInput } from "@/lib/validation/weather-fields";

interface Props {
  values: BulletinContextInput;
  onChange: (values: BulletinContextInput) => void;
}

export default function BulletinContextFields({ values, onChange }: Props) {
  const set = (key: keyof BulletinContextInput, value: string) =>
    onChange({ ...values, [key]: value });

  return (
    <div className="grid">
      <div className="field">
        <label>Forecast date *</label>
        <input
          type="date"
          value={values.forecast_date}
          onChange={(e) => set("forecast_date", e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label>Publication time *</label>
        <input
          type="time"
          value={values.publication_time}
          onChange={(e) => set("publication_time", e.target.value)}
          required
        />
      </div>
      <div className="field full">
        <label>Validity period *</label>
        <input
          value={values.validity_period}
          onChange={(e) => set("validity_period", e.target.value)}
          required
        />
      </div>
    </div>
  );
}

export function emptyBulletinContext(): BulletinContextInput {
  return { forecast_date: "", publication_time: "", validity_period: "" };
}
