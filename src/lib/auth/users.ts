import bcrypt from "bcrypt";
import { timingSafeEqual } from "crypto";
import { query } from "@/lib/db";
import type { UserRole } from "./config";

export type AuthUser = {
  user_id: number;
  full_name: string;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole | string;
  is_active: boolean;
};

function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

function safeEqualStrings(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function getUserFullName(userId: number): Promise<string | null> {
  const result = await query<{ full_name: string }>(
    `SELECT full_name FROM users WHERE user_id = $1 AND is_active = TRUE LIMIT 1`,
    [userId]
  );
  return result.rows[0]?.full_name?.trim() || null;
}

export async function findUserByLogin(login: string): Promise<AuthUser | null> {
  const trimmed = login.trim();
  if (!trimmed) return null;

  const result = await query<AuthUser>(
    `SELECT user_id, full_name, username, email, password_hash, role::text AS role, is_active
     FROM users
     WHERE is_active = TRUE
       AND (LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1))
     LIMIT 1`,
    [trimmed]
  );
  return result.rows[0] ?? null;
}

export async function verifyUserPassword(
  enteredPassword: string,
  storedHash: string
): Promise<boolean> {
  const hash = storedHash?.trim() ?? "";
  if (!hash || !enteredPassword) return false;

  if (isBcryptHash(hash)) {
    return bcrypt.compare(enteredPassword, hash);
  }

  // Allow legacy rows where password_hash was stored as plaintext.
  return safeEqualStrings(enteredPassword, hash);
}

export async function hashUserPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function upgradePasswordHash(userId: number, password: string): Promise<void> {
  const passwordHash = await hashUserPassword(password);
  await query(
    `UPDATE users
     SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $2`,
    [passwordHash, userId]
  );
}

export async function updateLastLogin(userId: number): Promise<void> {
  await query(
    `UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1`,
    [userId]
  );
}

export async function authenticateUser(
  login: string,
  password: string
): Promise<AuthUser | null> {
  const user = await findUserByLogin(login);
  if (!user) return null;

  const storedHash = user.password_hash?.trim() ?? "";
  const isValid = await verifyUserPassword(password, storedHash);
  if (!isValid) return null;

  // Migrate plaintext password_hash values to bcrypt after a successful login.
  if (storedHash && !isBcryptHash(storedHash)) {
    await upgradePasswordHash(user.user_id, password);
  }

  await updateLastLogin(user.user_id);
  return user;
}
