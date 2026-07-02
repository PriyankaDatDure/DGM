import { getTranslations } from "next-intl/server";
import type { ValidationMessage } from "@/lib/bulletin/types";
import { formatValidationMessages } from "./format-validation";

export async function formatValidationMessagesForLocale(
  messages: ValidationMessage[]
): Promise<string[]> {
  const tValidation = await getTranslations("validation");
  const tEnums = await getTranslations("enums");
  const tWizard = await getTranslations("wizard");

  return formatValidationMessages(
    messages,
    (key, values) => tValidation(key, values),
    (key, values) => tEnums(key, values),
    (key, values) => tWizard(key, values)
  );
}

export async function formatValidationSummary(
  messages: ValidationMessage[],
  limit = 3
): Promise<string> {
  const formatted = await formatValidationMessagesForLocale(messages.slice(0, limit));
  return formatted.join(" ");
}
