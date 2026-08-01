import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const email = process.env.ADMIN_EMAIL_INPUT?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD_INPUT;

if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
  throw new Error("Set ADMIN_EMAIL_INPUT to a valid email address.");
}

if (!password || password.length < 8) {
  throw new Error("Set ADMIN_PASSWORD_INPUT to a password with at least 8 characters.");
}

const databaseName = path.basename(process.env.DATABASE_FILENAME?.trim() || "hoza.sqlite");
const dataDirectory = path.join(process.cwd(), "data");
mkdirSync(dataDirectory, { recursive: true });

const database = new DatabaseSync(path.join(dataDirectory, databaseName));
database.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_idx
    ON admin_users (email COLLATE NOCASE);
`);

const salt = randomBytes(16);
const passwordHash = scryptSync(password, salt, 64);
const encodedPassword = `scrypt$${salt.toString("base64url")}$${passwordHash.toString("base64url")}`;
const now = new Date().toISOString();

database.prepare(`
  INSERT INTO admin_users (email, password_hash, active, created_at, updated_at)
  VALUES (?, ?, 1, ?, ?)
  ON CONFLICT(email) DO UPDATE SET
    password_hash = excluded.password_hash,
    active = 1,
    updated_at = excluded.updated_at
`).run(email, encodedPassword, now, now);

database.close();
console.log(`Admin user saved: ${email}`);
