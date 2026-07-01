import bcrypt from "bcrypt";
import { query } from "@/lib/db";
import type { UserRole } from "./config";

export type AuthUser = {
  user_id: number;
  full_name: string;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
};

export async function findUserByLogin(login: string): Promise<AuthUser | null> {
  const trimmed = login.trim();
  if (!trimmed) return null;

  const result = await query<AuthUser>(
    `SELECT user_id, full_name, username, email, password_hash, role, is_active
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
  return bcrypt.compare(enteredPassword, storedHash);
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

  const isValid = await verifyUserPassword(password, user.password_hash);
  if (!isValid) return null;

  await updateLastLogin(user.user_id);
  return user;
}
