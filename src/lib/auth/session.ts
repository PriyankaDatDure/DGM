import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "./config";
import { signSessionToken, verifySessionToken, type SessionPayload } from "./session-token";

export type SessionUser = Pick<SessionPayload, "userId" | "username" | "fullName" | "role">;

export async function isAuthenticated(sessionValue: string | undefined): Promise<boolean> {
  if (!sessionValue) return false;
  const payload = await verifySessionToken(sessionValue);
  return payload !== null;
}

export async function createSession(user: SessionUser): Promise<void> {
  const cookieStore = await cookies();
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const token = await signSessionToken({ ...user, exp });
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getSession(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await getSession();
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  return {
    userId: payload.userId,
    username: payload.username,
    fullName: payload.fullName,
    role: payload.role,
  };
}
