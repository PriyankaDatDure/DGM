import "server-only";

import pg from "pg";

// Return DATE/TIME columns as plain strings — avoids UTC shift on calendar dates.
pg.types.setTypeParser(1082, (value) => value); // date
pg.types.setTypeParser(1083, (value) => value); // time

const globalForPg = globalThis as typeof globalThis & {
  pgPool?: pg.Pool;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getPool(): pg.Pool {
  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new pg.Pool({
      host: requireEnv("DATABASE_HOST"),
      port: Number(process.env.DATABASE_PORT ?? 5432),
      database: requireEnv("DATABASE_NAME"),
      user: requireEnv("DATABASE_USER"),
      password: requireEnv("DATABASE_PASSWORD"),
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return globalForPg.pgPool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<pg.QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function toNullable(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function toNumericOrNull(value: string | undefined | null): number | null {
  const normalized = toNullable(value);
  if (normalized === null) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
