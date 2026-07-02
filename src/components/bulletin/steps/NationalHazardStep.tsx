"use client";

import { useTranslations } from "next-intl";
import { Hazard, NationalHazardEntry } from "@/lib/bulletin/types";
import { HAZARDS, RISK_LEVELS } from "@/lib/bulletin/constants";
import { useEnumLabels } from "@/lib/i18n/use-enum-labels";
import Field from "@/components/bulletin/Field";

interface Props {
  data: Record<Hazard, NationalHazardEntry>;
  onChange: (hazard: Hazard, entry: NationalHazardEntry) => void;
  fieldBlocking: Set<string>;
  fieldWarning: Set<string>;
}

export default function NationalHazardStep({ data, onChange, fieldBlocking, fieldWarning }: Props) {
  const t = useTranslations("form.nationalHazard");
  const tCommon = useTranslations("common");
  const { hazard: hazardLabel, riskLevel } = useEnumLabels();

  return (
    <div className="panel">
      <h2>{t("title")}</h2>
      <p className="desc">{t("desc")}</p>
      {HAZARDS.map((h) => {
        const entry = data[h];
        const set = (key: keyof NationalHazardEntry, value: string) => onChange(h, { ...entry, [key]: value });
        return (
          <div className="hazard-block" key={h}>
            <h4>{hazardLabel(h)} <span className="badge">{tCommon("national")}</span></h4>
            <div className="grid">
              <Field label={t("riskLevel")} required fieldKey={`nathazard:${h}:risk_level`} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
                errorMsg={t("riskLevelError")}>
                <select value={entry.risk_level} onChange={(e) => set("risk_level", e.target.value)}>
                  <option value="">{tCommon("select")}</option>
                  {RISK_LEVELS.map((r) => (
                    <option key={r} value={r}>{riskLevel(r)}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("areasConcerned")} optional fieldKey={`nathazard:${h}:areas_concerned`} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
                <input type="text" value={entry.areas_concerned} onChange={(e) => set("areas_concerned", e.target.value)} />
              </Field>
              <Field label={t("riskComment")} required full fieldKey={`nathazard:${h}:comment`} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
                hint={t("riskCommentHint")} errorMsg={t("riskCommentError")}>
                <textarea value={entry.comment} onChange={(e) => set("comment", e.target.value)} />
              </Field>
              <Field label={t("recommendations")} optional full fieldKey={`nathazard:${h}:recommendations`} fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
                <textarea value={entry.recommendations} onChange={(e) => set("recommendations", e.target.value)} />
              </Field>
            </div>
          </div>
        );
      })}
    </div>
  );
}
