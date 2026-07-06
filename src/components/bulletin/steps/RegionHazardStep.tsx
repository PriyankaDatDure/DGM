"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Hazard, RegionCode, RegionHazardEntry } from "@/lib/bulletin/types";
import {
  HAZARDS,
  REGIONS,
  RISK_LEVELS,
  prefecturesForRegion,
  regionDisplayLabel,
} from "@/lib/bulletin/constants";
import { useEnumLabels } from "@/lib/i18n/use-enum-labels";
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
  const t = useTranslations("form.regionHazard");
  const tNat = useTranslations("form.nationalHazard");
  const tCommon = useTranslations("common");
  const { hazard: hazardLabel, riskLevel } = useEnumLabels();

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
      <h2>{t("title")}</h2>
      <p className="desc">{t("desc")}</p>

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
                  <h4>{hazardLabel(h)}</h4>
                  <div className="grid">
                    <Field
                      label={tNat("riskLevel")}
                      required
                      fieldKey={`${key}:risk_level`}
                      fieldBlocking={fieldBlocking}
                      fieldWarning={fieldWarning}
                      errorMsg={tNat("riskLevelError")}
                    >
                      <select value={entry.risk_level} onChange={(e) => set("risk_level", e.target.value)}>
                        <option value="">{tCommon("select")}</option>
                        {RISK_LEVELS.map((r) => (
                          <option key={r} value={r}>{riskLevel(r)}</option>
                        ))}
                      </select>
                    </Field>
                    <Field
                      label={tNat("riskComment")}
                      required={entry.risk_level === "High" || entry.risk_level === "Very High"}
                      optional={entry.risk_level !== "High" && entry.risk_level !== "Very High"}
                      fieldKey={`${key}:comment`}
                      fieldBlocking={fieldBlocking}
                      fieldWarning={fieldWarning}
                      hint={
                        entry.risk_level === "High" || entry.risk_level === "Very High"
                          ? tNat("riskCommentHint")
                          : undefined
                      }
                      errorMsg={tNat("riskCommentError")}
                    >
                      <input type="text" value={entry.comment} onChange={(e) => set("comment", e.target.value)} />
                    </Field>
                    <Field
                      label={tNat("recommendations")}
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
                      label={t("affectedPrefectures")}
                      required={Boolean(entry.risk_level) && entry.risk_level !== "None"}
                      optional={!entry.risk_level || entry.risk_level === "None"}
                      full
                      fieldKey={`${key}:affected_prefectures`}
                      fieldBlocking={fieldBlocking}
                      fieldWarning={fieldWarning}
                      hint={t("affectedPrefecturesHint")}
                      errorMsg={t("affectedPrefecturesError")}
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
