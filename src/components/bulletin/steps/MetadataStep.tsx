"use client";

import { BulletinMetadata } from "@/lib/bulletin/types";
import { SUBMISSION_STATUSES } from "@/lib/bulletin/constants";
import { useEnumLabels } from "@/lib/i18n/use-enum-labels";
import Field from "@/components/bulletin/Field";
import { useTranslations } from "next-intl";

interface Props {
  data: BulletinMetadata;
  onChange: (data: BulletinMetadata) => void;
  fieldBlocking: Set<string>;
  fieldWarning: Set<string>;
}

export default function MetadataStep({ data, onChange, fieldBlocking, fieldWarning }: Props) {
  const t = useTranslations("form.metadata");
  const tCommon = useTranslations("common");
  const { submissionStatus } = useEnumLabels();
  const set = (key: keyof BulletinMetadata, value: string) => onChange({ ...data, [key]: value });

  return (
    <div className="panel">
      <h2>{t("title")}</h2>
      <p className="desc">{t("desc")}</p>
      <div className="grid">
        <Field label={t("forecastDate")} required fieldKey="meta:forecast_date" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
          hint={t("forecastDateHint")} errorMsg={t("forecastDateError")} warnMsg={t("forecastDateWarn")}>
          <input type="date" value={data.forecast_date} onChange={(e) => set("forecast_date", e.target.value)} />
        </Field>

        <Field label={t("publicationTime")} required fieldKey="meta:publication_time" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
          hint={t("publicationTimeHint")} errorMsg={t("publicationTimeError")}>
          <input type="time" value={data.publication_time} onChange={(e) => set("publication_time", e.target.value)} />
        </Field>

        <Field label={t("validityDate")} required fieldKey="meta:validity_date" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
          hint={t("validityDateHint")} errorMsg={t("validityDateError")}>
          <input type="date" value={data.validity_date} onChange={(e) => set("validity_date", e.target.value)} />
        </Field>

        <Field label={t("validityStartTime")} required fieldKey="meta:validity_start_time" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
          hint={t("validityStartTimeHint")} errorMsg={t("validityStartTimeError")}>
          <input type="time" value={data.validity_start_time} onChange={(e) => set("validity_start_time", e.target.value)} />
        </Field>

        <Field label={t("validityEndTime")} required fieldKey="meta:validity_end_time" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
          hint={t("validityEndTimeHint")}
          errorMsg={
            fieldBlocking.has("meta:validity_end_time") &&
            data.validity_date.trim() &&
            data.validity_start_time.trim() &&
            data.validity_end_time.trim()
              ? t("validityPeriodInconsistent")
              : t("validityEndTimeError")
          }>
          <input type="time" value={data.validity_end_time} onChange={(e) => set("validity_end_time", e.target.value)} />
        </Field>

        <Field label={t("dataSources")} required full fieldKey="meta:data_sources" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
          errorMsg={t("dataSourcesError")}>
          <textarea
            placeholder={t("dataSourcesPlaceholder")}
            value={data.data_sources}
            onChange={(e) => set("data_sources", e.target.value)}
          />
        </Field>

        <Field label={t("nationalForecastText")} required full fieldKey="meta:national_forecast_text" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
          errorMsg={t("nationalForecastTextError")}>
          <textarea
            placeholder={t("nationalForecastTextPlaceholder")}
            value={data.national_forecast_text}
            onChange={(e) => set("national_forecast_text", e.target.value)}
          />
        </Field>

        <Field label={t("generalComment")} optional full fieldKey="meta:general_comment" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
          <textarea value={data.general_comment} onChange={(e) => set("general_comment", e.target.value)} />
        </Field>

        <Field label={t("submissionStatus")} required fieldKey="meta:submission_status" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}
          errorMsg={t("submissionStatusError")}>
          <select value={data.submission_status} onChange={(e) => set("submission_status", e.target.value)}>
            <option value="">{tCommon("select")}</option>
            {SUBMISSION_STATUSES.map((s) => (
              <option key={s} value={s}>{submissionStatus(s)}</option>
            ))}
          </select>
        </Field>

        <Field label={t("forecasterName")} required fieldKey="meta:forecaster_name" fieldBlocking={fieldBlocking} fieldWarning={fieldWarning}>
          <input type="text" value={data.forecaster_name} onChange={(e) => set("forecaster_name", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}
