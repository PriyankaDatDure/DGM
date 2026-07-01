export const AUTH_COOKIE_NAME = "dgm_session";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET environment variable is required in production.");
  }
  return "dgm-dev-auth-secret-change-me";
}

export type UserRole =
  | "MOH_NATIONAL_ADMIN"
  | "MOH_DISTRICT_OFFICER"
  | "PUBLIC_DONOR_VIEWER";
