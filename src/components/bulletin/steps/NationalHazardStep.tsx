"use client";

import { Hazard, NationalHazardEntry } from "@/lib/bulletin/types";
import { HAZARDS, RISK_LEVELS } from "@/lib/bulletin/constants";
import Field from "@/components/bulletin/Field";

interface Props {
  data: Record<Hazard, NationalHazardEntry>;
  onChange: (hazard: Hazard, entry: NationalHazardEntry) => void;
  fieldBlocking: Set<string>;
  fieldWarning: Set<string>;
}

export default function NationalHazardStep({ data, onChange, fieldBlocking, fieldWarning }: Props) {
  return (
    <div className="panel">
      <h2>National climate hazard risk analysis</h2>
      <p className="desc">
        Only three hazard types are monitored: Heat wave, Flood, Strong wind. A comment is mandatory
        if risk level is High or Very High.
      </p>
      {HAZARDS.map((h) => {
        const entry = data[h];
        const set = (key: keyof NationalHazardEntry, value: string) => onChange(h, { ...entry, [key]: value });
        return (
          <div className="hazard-block" key={h}>
            <h4>{h} <span className="badge">national</span></h4>
            <div className="grid">
              <Field label="Risk level" required fieldKey={`nathazard:${h}:risk_level`} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
                errorMsg="Please select a valid risk level.">
                <select value={entry.risk_level} onChange={(e) => set("risk_level", e.target.value)}>
                  <option value="">— Select —</option>
                  {RISK_LEVELS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Areas concerned" optional fieldKey={`nathazard:${h}:areas_concerned`} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
                <input type="text" value={entry.areas_concerned} onChange={(e) => set("areas_concerned", e.target.value)} />
              </Field>
              <Field label="Risk comment" required full fieldKey={`nathazard:${h}:comment`} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
                hint="Mandatory if risk level is High or Very High." errorMsg="Please add a comment explaining this risk level.">
                <textarea value={entry.comment} onChange={(e) => set("comment", e.target.value)} />
              </Field>
              <Field label="Possible recommendations" optional full fieldKey={`nathazard:${h}:recommendations`} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
                <textarea value={entry.recommendations} onChange={(e) => set("recommendations", e.target.value)} />
              </Field>
            </div>
          </div>
        );
      })}
    </div>
  );
}
