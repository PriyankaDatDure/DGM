import fs from "fs";
import path from "path";
import pg from "pg";

function loadEnvLocal() {
  for (const line of fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split("\n")) {
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
  port: 5432,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

const tables = [
  "weather_bulletin",
  "national_forecast",
  "region_forecast",
  "national_hazard_risk",
  "regional_hazard_risk",
  "meteorological_interpretation",
];

const client = await pool.connect();
try {
  for (const table of tables) {
    const { rows } = await client.query(`SELECT * FROM ${table} LIMIT 1`);
    console.log(`\n=== sample ${table} ===`, rows[0] ?? "(empty)");
  }
} finally {
  client.release();
  await pool.end();
}
