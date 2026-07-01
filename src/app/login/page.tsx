import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-brand">
        <h1 className="login-project-name">DGM Daily Weather Forecast</h1>
        <p className="login-project-tagline">
          Climate &amp; Health Early Warning System
        </p>
      </div>
      <div className="login-card panel">
        <h2>Sign in</h2>
        <p className="desc">Access the transmission form with your account credentials.</p>
        <Suspense fallback={<div className="login-loading">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
