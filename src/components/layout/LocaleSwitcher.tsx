"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LOCALE_COOKIE, type AppLocale } from "@/i18n/routing";

export default function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("nav");
  const router = useRouter();

  const setLocale = (nextLocale: AppLocale) => {
    if (nextLocale === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${nextLocale};path=/;max-age=31536000;samesite=lax`;
    router.refresh();
  };

  return (
    <div className="locale-switcher" role="group" aria-label={t("language")}>
      <button
        type="button"
        className={locale === "fr" ? "active" : ""}
        onClick={() => setLocale("fr")}
        aria-pressed={locale === "fr"}
      >
        FR
      </button>
      <button
        type="button"
        className={locale === "en" ? "active" : ""}
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
