import * as cheerio from "cheerio";
import { env } from "../config/env";
import { Vacancy } from "../models/vacancy";

function absoluteUrl(href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }

  return new URL(href, "https://jobs.dou.ua").toString();
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export class DouClient {
  async fetchFirstJobVacancies(): Promise<Vacancy[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.httpTimeoutMs);

    try {
      const response = await fetch(env.douFirstJobUrl, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; DOUFirstJobMonitor/1.0; +https://github.com/)",
          "Accept-Language": "uk,en;q=0.9",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch DOU page: ${response.status} ${response.statusText}`,
        );
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const vacancies: Vacancy[] = [];
      const scrapedAt = new Date().toISOString();

      $(".l-vacancy").each((_, element) => {
        const root = $(element);

        const titleAnchor = root.find(".title a.vt, .title a").first();
        const title = cleanText(titleAnchor.text());
        const href = titleAnchor.attr("href") ?? "";
        const url = href ? absoluteUrl(href) : "";

        const company = cleanText(
          root.find(".company").first().text() ||
            root.find(".title strong").first().text() ||
            "",
        );

        const description = cleanText(
          root.find(".sh-info").first().text() ||
            root.find(".descr").first().text() ||
            root.text(),
        );

        const publishedAt =
          cleanText(root.find(".date").first().text()) || null;

        if (!title || !url) {
          return;
        }

        vacancies.push({
          url,
          title,
          company: company || "Unknown company",
          description,
          publishedAt,
          scrapedAt,
        });
      });

      return this.deduplicateByUrl(vacancies);
    } finally {
      clearTimeout(timeout);
    }
  }

  async fetchVacancyDetails(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.httpTimeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; DOUFirstJobMonitor/1.0; +https://github.com/)",
          "Accept-Language": "uk,en;q=0.9",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch vacancy details: ${response.status} ${response.statusText}`,
        );
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const details = cleanText(
        $(".b-typo.vacancy-section, .l-vacancy-section, .vacancy-section")
          .first()
          .text() ||
          $("main").text() ||
          $("body").text(),
      );

      return details;
    } finally {
      clearTimeout(timeout);
    }
  }

  private deduplicateByUrl(vacancies: Vacancy[]): Vacancy[] {
    const seen = new Set<string>();
    const result: Vacancy[] = [];

    for (const vacancy of vacancies) {
      if (seen.has(vacancy.url)) continue;
      seen.add(vacancy.url);
      result.push(vacancy);
    }

    return result;
  }
}
