"use client";

import { useTranslations } from "next-intl";
import { Interpretation, ValidationResult } from "@/lib/bulletin/types";
import { useValidationFormatter } from "@/lib/i18n/use-validation-formatter";
import Field from "@/components/bulletin/Field";

interface Props {
  data: Interpretation;
  onChange: (data: Interpretation) => void;
  fieldBlocking: Set<string>;
  fieldWarning: Set<string>;
  validationResult?: ValidationResult | null;
  isEditing?: boolean;
}

export default function InterpretationStep({
  data,
  onChange,
  fieldBlocking,
  fieldWarning,
  validationResult,
  isEditing = false,
}: Props) {
  const t = useTranslations("form.interpretation");
  const tWizard = useTranslations("wizard");
  const { formatAll } = useValidationFormatter();
  const set = (key: keyof Interpretation, value: string) => onChange({ ...data, [key]: value });

  const actionLabel = isEditing ? tWizard("update") : tWizard("submit");
  const blockingMessages = validationResult
    ? formatAll(validationResult.blocking)
    : [];

  return (
    <>
      <div className="panel">
        <h2>{t("title")}</h2>
        <p className="desc">{t("desc", { action: actionLabel })}</p>
        <Field label={t("generalSituation")} required full fieldKey="interp:general_situation" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
          errorMsg={t("generalSituationError")} warnMsg={t("generalSituationWarn")}>
          <textarea value={data.general_situation} onChange={(e) => set("general_situation", e.target.value)} />
        </Field>
        <Field label={t("expectedConditions")} optional full fieldKey="interp:expected_conditions" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
          <textarea value={data.expected_conditions} onChange={(e) => set("expected_conditions", e.target.value)} />
        </Field>
        <Field label={t("riskAreas")} optional full fieldKey="interp:risk_areas" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
          <textarea value={data.risk_areas} onChange={(e) => set("risk_areas", e.target.value)} />
        </Field>
        <Field label={t("expectedEvolution")} optional full fieldKey="interp:expected_evolution" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
          <textarea value={data.expected_evolution} onChange={(e) => set("expected_evolution", e.target.value)} />
        </Field>
        <Field label={t("recommendations")} optional full fieldKey="interp:recommendations" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
          <textarea value={data.recommendations} onChange={(e) => set("recommendations", e.target.value)} />
        </Field>
        <Field label={t("additionalNotes")} optional full fieldKey="interp:additional_notes" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
          <textarea value={data.additional_notes} onChange={(e) => set("additional_notes", e.target.value)} />
        </Field>
      </div>

      {validationResult && validationResult.blocking.length > 0 && (
        <div className="panel validation-summary">
          <h2>{isEditing ? t("issuesBeforeSave") : t("issuesBeforeSubmit")}</h2>
          <ul>
            {blockingMessages.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
