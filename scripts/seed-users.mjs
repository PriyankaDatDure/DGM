import fs from "fs";
import path from "path";
import pg from "pg";
import bcrypt from "bcrypt";

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
  port: Number(process.env.DATABASE_PORT || 5433),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

const PASSWORD = "Admin@123";
const users = [
  {
    full_name: "MoH National Admin",
    username: "national_admin",
    email: "national.admin@moh.gov.ng",
    role: "MOH_NATIONAL_ADMIN",
  },
  {
    full_name: "MoH District Officer",
    username: "district_officer",
    email: "district.officer@moh.gov.ng",
    role: "MOH_DISTRICT_OFFICER",
  },
  {
    full_name: "Public/Donor Viewer",
    username: "public_viewer",
    email: "viewer@donor.org",
    role: "PUBLIC_DONOR_VIEWER",
  },
];

const passwordHash = await bcrypt.hash(PASSWORD, 10);

for (const user of users) {
  const existing = await pool.query(
    `SELECT user_id FROM users WHERE username = $1 OR email = $2`,
    [user.username, user.email]
  );
  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE users
       SET password_hash = $1, full_name = $2, role = $3::user_role, is_active = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE username = $4 OR email = $5`,
      [passwordHash, user.full_name, user.role, user.username, user.email]
    );
    console.log(`Updated ${user.username}`);
  } else {
    await pool.query(
      `INSERT INTO users (full_name, username, email, password_hash, role, organization, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5::user_role, 'Ministry of Health', TRUE, TRUE)`,
      [user.full_name, user.username, user.email, passwordHash, user.role]
    );
    console.log(`Created ${user.username}`);
  }
}

console.log("Done. Password for all seeded users:", PASSWORD);
await pool.end();
