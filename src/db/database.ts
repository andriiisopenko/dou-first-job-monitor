import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const dbDir = path.dirname(env.databasePath);
fs.mkdirSync(dbDir, { recursive: true });

export const db = new Database(env.databasePath);

db.pragma("journal_mode = WAL");

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vacancies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      description TEXT NOT NULL,
      published_at TEXT,
      scraped_at TEXT NOT NULL,
      is_relevant INTEGER NOT NULL DEFAULT 0,
      notified_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_vacancies_url ON vacancies(url);
    CREATE INDEX IF NOT EXISTS idx_vacancies_is_relevant ON vacancies(is_relevant);
    CREATE INDEX IF NOT EXISTS idx_vacancies_notified_at ON vacancies(notified_at);
  `);

  logger.info("Database initialized", { path: env.databasePath });
}
