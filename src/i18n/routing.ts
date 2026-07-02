export const locales = ["en", "fr"] as const;
export type AppLocale = (typeof locales)[number];

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function resolveDefaultLocale(): AppLocale {
  const configured = process.env.DEFAULT_LOCALE ?? process.env.NEXT_PUBLIC_DEFAULT_LOCALE;
  if (configured === "en" || configured === "fr") return configured;
  return process.env.NODE_ENV === "production" ? "fr" : "en";
}

export const defaultLocale: AppLocale = resolveDefaultLocale();

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return value === "en" || value === "fr";
}
