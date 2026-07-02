import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import LoginForm from "@/components/auth/LoginForm";
import LocaleSwitcher from "@/components/layout/LocaleSwitcher";

export default async function LoginPage() {
  const tBrand = await getTranslations("brand");
  const tAuth = await getTranslations("auth");
  const tCommon = await getTranslations("common");

  return (
    <div className="login-page">
      <div className="login-brand">
        <h1 className="login-project-name">{tBrand("appName")}</h1>
        <p className="login-project-tagline">{tBrand("tagline")}</p>
      </div>
      <div className="login-card panel">
        <div className="locale-switcher-wrap">
          <LocaleSwitcher />
        </div>
        <h2>{tAuth("signInTitle")}</h2>
        <p className="desc">{tAuth("signInDesc")}</p>
        <Suspense fallback={<div className="login-loading">{tCommon("loading")}</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
