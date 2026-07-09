"use client";

import { useTranslations } from "next-intl";
import { Hazard, NationalHazardEntry } from "@/lib/bulletin/types";
import { HAZARDS, PREFECTURES, RISK_LEVELS } from "@/lib/bulletin/constants";
import { useEnumLabels } from "@/lib/i18n/use-enum-labels";
import Field from "@/components/bulletin/Field";
import PrefectureChipPicker from "@/components/bulletin/PrefectureChipPicker";

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

  const togglePrefecture = (hazard: Hazard, prefecture: string) => {
    const entry = data[hazard];
    const exists = entry.affected_prefectures.includes(prefecture);
    const affected_prefectures = exists
      ? entry.affected_prefectures.filter((p) => p !== prefecture)
      : [...entry.affected_prefectures, prefecture];
    onChange(hazard, { ...entry, affected_prefectures });
  };

  return (
    <div className="panel">
      <h2>{t("title")}</h2>
      <p className="desc">{t("desc")}</p>
      {HAZARDS.map((h) => {
        const entry = data[h];
        const set = (key: keyof NationalHazardEntry, value: string) =>
          onChange(h, { ...entry, [key]: value });
        const commentRequired = entry.risk_level === "High" || entry.risk_level === "Very High";
        const prefecturesRequired = Boolean(entry.risk_level) && entry.risk_level !== "None";
        return (
          <div className="hazard-block" key={h}>
            <h4>
              {hazardLabel(h)} <span className="badge">{tCommon("national")}</span>
            </h4>
            <div className="grid">
              <Field
                label={t("riskLevel")}
                required
                fieldKey={`nathazard:${h}:risk_level`}
                fieldBlocking={fieldBlocking}
                fieldWarning={fieldWarning}
                errorMsg={t("riskLevelError")}
              >
                <select value={entry.risk_level} onChange={(e) => set("risk_level", e.target.value)}>
                  <option value="">{tCommon("select")}</option>
                  {RISK_LEVELS.map((r) => (
                    <option key={r} value={r}>
                      {riskLevel(r)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label={t("affectedPrefectures")}
                required={prefecturesRequired}
                optional={!prefecturesRequired}
                fieldKey={`nathazard:${h}:affected_prefectures`}
                fieldBlocking={fieldBlocking}
                fieldWarning={fieldWarning}
                hint={t("affectedPrefecturesHint")}
                errorMsg={t("affectedPrefecturesError")}
              >
                <PrefectureChipPicker
                  options={PREFECTURES}
                  selected={entry.affected_prefectures}
                  onToggle={(prefecture) => togglePrefecture(h, prefecture)}
                />
              </Field>
              <Field
                label={t("riskComment")}
                required={commentRequired}
                optional={!commentRequired}
                full
                fieldKey={`nathazard:${h}:comment`}
                fieldBlocking={fieldBlocking}
                fieldWarning={fieldWarning}
                hint={commentRequired ? t("riskCommentHint") : undefined}
                errorMsg={t("riskCommentError")}
              >
                <textarea value={entry.comment} onChange={(e) => set("comment", e.target.value)} />
              </Field>
              <Field
                label={t("recommendations")}
                optional
                full
                fieldKey={`nathazard:${h}:recommendations`}
                fieldBlocking={fieldBlocking}
                fieldWarning={fieldWarning}
              >
                <textarea
                  value={entry.recommendations}
                  onChange={(e) => set("recommendations", e.target.value)}
                />
              </Field>
            </div>
          </div>
        );
      })}
    </div>
  );
}
