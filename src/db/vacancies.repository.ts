import { db } from "./database";
import { Vacancy } from "../models/vacancy";

const insertStmt = db.prepare(`
  INSERT INTO vacancies (
    url,
    title,
    company,
    description,
    published_at,
    scraped_at,
    is_relevant,
    notified_at
  ) VALUES (
    @url,
    @title,
    @company,
    @description,
    @publishedAt,
    @scrapedAt,
    @isRelevant,
    @notifiedAt
  )
`);

const existsStmt = db.prepare(`
  SELECT 1
  FROM vacancies
  WHERE url = ?
  LIMIT 1
`);

const countStmt = db.prepare(`
  SELECT COUNT(*) as count
  FROM vacancies
`);

const markNotifiedStmt = db.prepare(`
  UPDATE vacancies
  SET notified_at = ?
  WHERE url = ?
`);

export class VacanciesRepository {
  countAll(): number {
    const row = countStmt.get() as { count: number };
    return row.count;
  }

  existsByUrl(url: string): boolean {
    const row = existsStmt.get(url);
    return Boolean(row);
  }

  save(
    vacancy: Vacancy,
    isRelevant: boolean,
    notifiedAt: string | null = null,
  ): void {
    insertStmt.run({
      url: vacancy.url,
      title: vacancy.title,
      company: vacancy.company,
      description: vacancy.description,
      publishedAt: vacancy.publishedAt ?? null,
      scrapedAt: vacancy.scrapedAt,
      isRelevant: isRelevant ? 1 : 0,
      notifiedAt,
    });
  }

  markAsNotified(url: string, notifiedAt: string): void {
    markNotifiedStmt.run(notifiedAt, url);
  }
}
