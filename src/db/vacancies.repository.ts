import { db } from "./database";
import { Vacancy } from "../models/vacancy";

export class VacanciesRepository {
  countAll(): number {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM vacancies
    `);

    const row = stmt.get() as { count: number };
    return row.count;
  }

  existsByUrl(url: string): boolean {
    const stmt = db.prepare(`
      SELECT 1
      FROM vacancies
      WHERE url = ?
      LIMIT 1
    `);

    const row = stmt.get(url);
    return Boolean(row);
  }

  save(
    vacancy: Vacancy,
    isRelevant: boolean,
    notifiedAt: string | null = null,
  ): void {
    const stmt = db.prepare(`
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

    stmt.run({
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
    const stmt = db.prepare(`
      UPDATE vacancies
      SET notified_at = ?
      WHERE url = ?
    `);

    stmt.run(notifiedAt, url);
  }
}
