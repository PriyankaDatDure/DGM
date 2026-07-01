"use client";

import { useState } from "react";
import { Hazard, RegionCode, RegionHazardEntry } from "@/lib/bulletin/types";
import {
  HAZARDS,
  REGIONS,
  RISK_LEVELS,
  prefecturesForRegion,
  regionDisplayLabel,
} from "@/lib/bulletin/constants";
import Field from "@/components/bulletin/Field";
import PrefectureChipPicker from "@/components/bulletin/PrefectureChipPicker";

interface Props {
  data: Record<RegionCode, Record<Hazard, RegionHazardEntry>>;
  onChange: (region: RegionCode, hazard: Hazard, entry: RegionHazardEntry) => void;
  fieldBlocking: Set<string>;
  fieldWarning: Set<string>;
}

export default function RegionHazardStep({ data, onChange, fieldBlocking, fieldWarning }: Props) {
  const [openRegion, setOpenRegion] = useState<RegionCode | null>("R1");

  const togglePrefecture = (region: RegionCode, hazard: Hazard, prefecture: string) => {
    const entry = data[region][hazard];
    const exists = entry.affected_prefectures.includes(prefecture);
    const nextPrefectures = exists
      ? entry.affected_prefectures.filter((p) => p !== prefecture)
      : [...entry.affected_prefectures, prefecture];
    onChange(region, hazard, { ...entry, affected_prefectures: nextPrefectures });
  };

  return (
    <div className="panel">
      <h2>Climate hazard risk by region</h2>
      <p className="desc">
        Each region has three rows — one per hazard. If risk is anything other than "None," the
        affected prefectures within that region must be specified.
      </p>

      {REGIONS.map((region) => (
        <details
          className="accordion"
          key={region}
          open={openRegion === region}
        >
          <summary
            onClick={(e) => {
              e.preventDefault();
              setOpenRegion((current) => (current === region ? null : region));
            }}
          >
            {regionDisplayLabel(region)}
          </summary>
          <div className="body">
            {HAZARDS.map((h) => {
              const entry = data[region][h];
              const key = `regionhazard:${region}:${h}`;
              const set = (k: keyof RegionHazardEntry, value: string) =>
                onChange(region, h, { ...entry, [k]: value });
              return (
                <div className="hazard-block" key={h}>
                  <h4>{h}</h4>
                  <div className="grid">
                    <Field
                      label="Risk level"
                      required
                      fieldKey={`${key}:risk_level`}
                      fieldBlocking={fieldBlocking}
                      fieldWarning={fieldWarning}
                      errorMsg="Please select a valid risk level."
                    >
                      <select value={entry.risk_level} onChange={(e) => set("risk_level", e.target.value)}>
                        <option value="">— Select —</option>
                        {RISK_LEVELS.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </Field>
                    <Field
                      label="Comment"
                      fieldKey={`${key}:comment`}
                      fieldBlocking={fieldBlocking}
                      fieldWarning={fieldWarning}
                      hint="Mandatory if risk level is High or Very High."
                      errorMsg="Please add a comment explaining this risk level."
                    >
                      <input type="text" value={entry.comment} onChange={(e) => set("comment", e.target.value)} />
                    </Field>
                    <Field
                      label="Possible recommendations"
                      optional
                      full
                      fieldKey={`${key}:recommendations`}
                      fieldBlocking={fieldBlocking}
                      fieldWarning={fieldWarning}
                    >
                      <input
                        type="text"
                        value={entry.recommendations}
                        onChange={(e) => set("recommendations", e.target.value)}
                      />
                    </Field>
                    <Field
                      label="Affected prefectures"
                      full
                      fieldKey={`${key}:affected_prefectures`}
                      fieldBlocking={fieldBlocking}
                      fieldWarning={fieldWarning}
                      hint="Required if risk level is not None. Only prefectures in this region are listed."
                      errorMsg="Please indicate the affected prefectures within the region."
                      warnMsg='Affected prefectures are empty. Please verify the risk level is "None".'
                    >
                      <PrefectureChipPicker
                        options={prefecturesForRegion(region)}
                        selected={entry.affected_prefectures}
                        onToggle={(p) => togglePrefecture(region, h, p)}
                      />
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      ))}
    </div>
  );
}
