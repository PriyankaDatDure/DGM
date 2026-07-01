"use client";

import type { WeatherBulletinOption } from "@/types/database";
import { formatDateDisplay } from "@/lib/format/dates";

interface Props {
  value: string;
  options: WeatherBulletinOption[];
  onChange: (value: string) => void;
  required?: boolean;
}

export default function BulletinSelect({ value, options, onChange, required }: Props) {
  return (
    <div className="field">
      <label>Bulletin ID *</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        <option value="">— Select bulletin —</option>
        {options.map((option) => (
          <option key={option.bulletin_id} value={option.bulletin_id}>
            {option.bulletin_id.slice(0, 8)}… — {formatDateDisplay(option.forecast_date)} —{" "}
            {option.forecaster_name ?? "Unknown"}
          </option>
        ))}
      </select>
    </div>
  );
}
