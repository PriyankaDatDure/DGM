"use client";

import { BulletinMetadata } from "@/lib/bulletin/types";
import { SUBMISSION_STATUSES } from "@/lib/bulletin/constants";
import Field from "@/components/bulletin/Field";

interface Props {
  data: BulletinMetadata;
  onChange: (data: BulletinMetadata) => void;
  fieldBlocking: Set<string>;
  fieldWarning: Set<string>;
}

export default function MetadataStep({ data, onChange, fieldBlocking, fieldWarning }: Props) {
  const set = (key: keyof BulletinMetadata, value: string) => onChange({ ...data, [key]: value });

  return (
    <div className="panel">
      <h2>Bulletin metadata</h2>
      <p className="desc">General information entered once for this daily bulletin.</p>
      <div className="grid">
        <Field label="Forecast date" required fieldKey="meta:forecast_date" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
          hint="Date covered by the forecast." errorMsg="Please enter the forecast date." warnMsg="The forecast date seems old. Please verify.">
          <input type="date" value={data.forecast_date} onChange={(e) => set("forecast_date", e.target.value)} />
        </Field>

        <Field label="Publication time" required fieldKey="meta:publication_time" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
          hint="Local publication / transmission time." errorMsg="Please enter the bulletin publication time.">
          <input type="time" value={data.publication_time} onChange={(e) => set("publication_time", e.target.value)} />
        </Field>

        <Field label="Validity period" required full fieldKey="meta:validity_period" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
          errorMsg="Please enter the forecast validity period (end time must be later than start time).">
          <input
            type="text"
            placeholder="e.g. From 2026-07-01 09:00 local time to 23:59 local time"
            value={data.validity_period}
            onChange={(e) => set("validity_period", e.target.value)}
          />
        </Field>

        <Field label="Data sources" required full fieldKey="meta:data_sources" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
          <textarea
            placeholder="e.g. Surface observations; Eumetsat; NOAA; Windy; Ogimet"
            value={data.data_sources}
            onChange={(e) => set("data_sources", e.target.value)}
          />
        </Field>

        <Field label="National forecast summary" required full fieldKey="meta:national_forecast_text" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
          <textarea
            placeholder="Narrative summary of the national weather situation"
            value={data.national_forecast_text}
            onChange={(e) => set("national_forecast_text", e.target.value)}
          />
        </Field>

        <Field label="Additional comments" optional full fieldKey="meta:general_comment" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
          <textarea value={data.general_comment} onChange={(e) => set("general_comment", e.target.value)} />
        </Field>

        <Field label="Submission status" required fieldKey="meta:submission_status" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
          errorMsg="Please enter the submission status before finalizing the form.">
          <select value={data.submission_status} onChange={(e) => set("submission_status", e.target.value)}>
            <option value="">— Select —</option>
            {SUBMISSION_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>

        <Field label="Forecaster name" required fieldKey="meta:forecaster_name" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
          <input type="text" value={data.forecaster_name} onChange={(e) => set("forecaster_name", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}
