import fs from "fs";
import path from "path";
import pg from "pg";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) throw new Error(".env.local not found");
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
}

loadEnvLocal();

const pool = new pg.Pool({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 5432),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

const check = await pool.query(
  `SELECT column_name FROM information_schema.columns
   WHERE table_name = 'regional_hazard_risk' AND column_name = 'affected_subprefectures'`
);
if (check.rows.length === 0) {
  await pool.query(
    `ALTER TABLE regional_hazard_risk ADD COLUMN affected_subprefectures character varying[]`
  );
  console.log("Added affected_subprefectures column");
} else {
  console.log("Column already exists");
}
await pool.end();
