"use client";

import { Interpretation, ValidationResult } from "@/lib/bulletin/types";
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
  const set = (key: keyof Interpretation, value: string) => onChange({ ...data, [key]: value });

  return (
    <>
      <div className="panel">
        <h2>Meteorological interpretation</h2>
        <p className="desc">
          Free-text narrative interpretation of the daily bulletin. General situation is mandatory
          and should be more than 20 characters. Use{" "}
          <strong>{isEditing ? "Update bulletin" : "Submit bulletin"}</strong> below to validate and
          save to the database.
        </p>
      <Field label="General situation" required full fieldKey="interp:general_situation" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
        errorMsg="Please enter the national meteorological interpretation." warnMsg="The interpretation seems very short. Please verify whether it is sufficient.">
        <textarea value={data.general_situation} onChange={(e) => set("general_situation", e.target.value)} />
      </Field>
      <Field label="Expected conditions" optional full fieldKey="interp:expected_conditions" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
        <textarea value={data.expected_conditions} onChange={(e) => set("expected_conditions", e.target.value)} />
      </Field>
      <Field label="Risk areas" optional full fieldKey="interp:risk_areas" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
        <textarea value={data.risk_areas} onChange={(e) => set("risk_areas", e.target.value)} />
      </Field>
      <Field label="Expected evolution" optional full fieldKey="interp:expected_evolution" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
        <textarea value={data.expected_evolution} onChange={(e) => set("expected_evolution", e.target.value)} />
      </Field>
      <Field label="Recommendations" optional full fieldKey="interp:recommendations" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
        <textarea value={data.recommendations} onChange={(e) => set("recommendations", e.target.value)} />
      </Field>
      <Field label="Additional notes" optional full fieldKey="interp:additional_notes" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
        <textarea value={data.additional_notes} onChange={(e) => set("additional_notes", e.target.value)} />
      </Field>
      </div>

      {validationResult && validationResult.blocking.length > 0 && (
        <div className="panel validation-summary">
          <h2>{validationResult && validationResult.blocking.length > 0 ? "Issues to fix before saving" : "Issues to fix before submitting"}</h2>
          <ul>
            {validationResult.blocking.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
