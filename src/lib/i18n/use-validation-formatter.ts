"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import type { ValidationMessage } from "@/lib/bulletin/types";
import { formatValidationMessage, formatValidationMessages } from "./format-validation";

export function useValidationFormatter() {
  const tValidation = useTranslations("validation");
  const tEnums = useTranslations("enums");
  const tWizard = useTranslations("wizard");

  const formatOne = useCallback(
    (message: ValidationMessage) =>
      formatValidationMessage(
        (key, values) => tValidation(key, values),
        (key, values) => tEnums(key, values),
        (key, values) => tWizard(key, values),
        message
      ),
    [tValidation, tEnums, tWizard]
  );

  const formatAll = useCallback(
    (messages: ValidationMessage[]) =>
      formatValidationMessages(
        messages,
        (key, values) => tValidation(key, values),
        (key, values) => tEnums(key, values),
        (key, values) => tWizard(key, values)
      ),
    [tValidation, tEnums, tWizard]
  );

  return { formatOne, formatAll };
}
