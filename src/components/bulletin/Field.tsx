"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface FieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  errorMsg?: string;
  warnMsg?: string;
  fieldKey: string;
  fieldBlocking: Set<string>;
  fieldWarning: Set<string>;
  full?: boolean;
  children: React.ReactNode;
}

export default function Field({
  label, required, optional, hint, errorMsg, warnMsg, fieldKey,
  fieldBlocking, fieldWarning, full, children,
}: FieldProps) {
  const t = useTranslations("common");
  const hasErr = fieldBlocking.has(fieldKey);
  const hasWarn = !hasErr && fieldWarning.has(fieldKey);
  const cls = ["field", full ? "full" : "", hasErr ? "has-err" : "", hasWarn ? "has-warn" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls}>
      <label>
        {label}
        {required && <span className="req">{t("required")}</span>}
        {optional && <span className="opt"> {t("optional")}</span>}
      </label>
      {children}
      {hint && <div className="hint">{hint}</div>}
      {hasErr && errorMsg && <div className="msg-err">{errorMsg}</div>}
      {hasWarn && warnMsg && <div className="msg-warn">{warnMsg}</div>}
    </div>
  );
}
