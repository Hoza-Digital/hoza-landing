import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const globalDatabase = globalThis as typeof globalThis & {
  hozaDatabase?: DatabaseSync;
};

function databasePath() {
  const configuredName = process.env.DATABASE_FILENAME?.trim() || "hoza.sqlite";
  return path.join(process.cwd(), "data", path.basename(configuredName));
}

export function getDatabase() {
  if (globalDatabase.hozaDatabase) return globalDatabase.hozaDatabase;

  const filename = databasePath();
  mkdirSync(path.dirname(filename), { recursive: true });

  const database = new DatabaseSync(filename);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL,
      whatsapp TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL,
      service TEXT NOT NULL,
      description TEXT NOT NULL,
      budget TEXT NOT NULL,
      timeline TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'reviewing', 'contacted', 'archived')),
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS enquiries_created_at_idx
      ON enquiries (created_at DESC);
    CREATE INDEX IF NOT EXISTS enquiries_status_idx
      ON enquiries (status);

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

  globalDatabase.hozaDatabase = database;
  return database;
}
