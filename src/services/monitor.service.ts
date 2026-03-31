import { DouClient } from "../clients/dou.client";
import { TelegramClient } from "../clients/telegram.client";
import { VacanciesRepository } from "../db/vacancies.repository";
import { Vacancy } from "../models/vacancy";
import { isRelevantVacancy } from "./relevance.service";
import { logger } from "../utils/logger";

export class MonitorService {
  constructor(
    private readonly douClient: DouClient,
    private readonly repository: VacanciesRepository,
    private readonly telegramClient: TelegramClient,
  ) {}

  async run(): Promise<void> {
    logger.info("Starting DOU first-job monitor run");

    const vacancies = await this.douClient.fetchFirstJobVacancies();
    logger.info("Fetched vacancies from DOU", { count: vacancies.length });

    if (vacancies.length === 0) {
      logger.warn("No vacancies found on DOU page");
      return;
    }

    const totalInDb = this.repository.countAll();

    if (totalInDb === 0) {
      await this.bootstrap(vacancies);
      return;
    }

    await this.processDailyCheck(vacancies);
  }

  private async bootstrap(vacancies: Vacancy[]): Promise<void> {
    logger.info("Database is empty. Running bootstrap mode");

    let saved = 0;
    let relevant = 0;

    for (const vacancy of vacancies) {
      const matches = isRelevantVacancy(vacancy);
      if (matches) relevant += 1;

      this.repository.save(vacancy, matches, null);
      saved += 1;
    }

    logger.info("Bootstrap finished", {
      saved,
      relevantMarked: relevant,
      telegramNotificationsSent: 0,
    });
  }

  private async processDailyCheck(vacancies: Vacancy[]): Promise<void> {
    logger.info("Running daily check mode");

    let newCount = 0;
    let notified = 0;
    let skippedAsKnown = 0;
    let skippedAsIrrelevant = 0;

    for (const vacancy of vacancies) {
      const exists = this.repository.existsByUrl(vacancy.url);

      if (exists) {
        skippedAsKnown += 1;
        continue;
      }

      newCount += 1;
      const relevant = isRelevantVacancy(vacancy);

      if (!relevant) {
        this.repository.save(vacancy, false, null);
        skippedAsIrrelevant += 1;
        logger.info("New vacancy is not relevant", {
          title: vacancy.title,
          url: vacancy.url,
        });
        continue;
      }

      const notifiedAt = new Date().toISOString();

      try {
        await this.telegramClient.sendNewVacancyMessage({
          title: vacancy.title,
          company: vacancy.company,
          url: vacancy.url,
        });

        this.repository.save(vacancy, true, notifiedAt);
        notified += 1;

        logger.info("Telegram notification sent", {
          title: vacancy.title,
          company: vacancy.company,
          url: vacancy.url,
        });
      } catch (error) {
        logger.error("Failed to send Telegram message", {
          title: vacancy.title,
          url: vacancy.url,
          error: error instanceof Error ? error.message : String(error),
        });

        // Persist as known but not notified to avoid data loss.
        // If you want retries later, you could store notification_status separately.
        this.repository.save(vacancy, true, null);
      }
    }

    logger.info("Daily check finished", {
      newCount,
      notified,
      skippedAsKnown,
      skippedAsIrrelevant,
    });
  }
}
