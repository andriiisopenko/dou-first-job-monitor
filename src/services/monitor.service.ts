import { DouClient } from "../clients/dou.client";
import { TelegramClient } from "../clients/telegram.client";
import { env } from "../config/env";
import { VacanciesRepository } from "../db/vacancies.repository";
import { Vacancy } from "../models/vacancy";
import { analyzeVacancy } from "./relevance.service";
import { logger } from "../utils/logger";

export class MonitorService {
  constructor(
    private readonly douClient: DouClient,
    private readonly repository: VacanciesRepository,
    private readonly telegramClient: TelegramClient,
  ) {}

  async run(): Promise<void> {
    logger.info("Starting DOU first-job monitor run");

    if (env.heartbeatEveryRun) {
      try {
        await this.telegramClient.sendHeartbeatMessage();
      } catch (error) {
        logger.error("Failed to send heartbeat message", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const vacancies = await this.douClient.fetchFirstJobVacancies();
    logger.info("Fetched vacancies from DOU", { count: vacancies.length });

    if (vacancies.length === 0) {
      logger.warn("No vacancies found on DOU page");

      if (env.summaryEveryRun) {
        await this.safeSendSummary({
          totalFetched: 0,
          newCount: 0,
          relevantNewCount: 0,
          notified: 0,
          skippedAsKnown: 0,
          skippedAsIrrelevant: 0,
          debugLines: [],
        });
      }

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
    let relevantMarked = 0;

    for (const vacancy of vacancies) {
      const detailedDescription = await this.tryFetchDetails(vacancy.url);
      const enrichedVacancy: Vacancy = {
        ...vacancy,
        description: detailedDescription || vacancy.description,
      };

      const analysis = analyzeVacancy(enrichedVacancy);
      if (analysis.isRelevant) relevantMarked += 1;

      this.repository.save(enrichedVacancy, analysis.isRelevant, null);
      saved += 1;
    }

    logger.info("Bootstrap finished", {
      saved,
      relevantMarked,
      telegramNotificationsSent: 0,
    });

    if (env.summaryEveryRun) {
      await this.safeSendSummary({
        totalFetched: vacancies.length,
        newCount: 0,
        relevantNewCount: 0,
        notified: 0,
        skippedAsKnown: vacancies.length,
        skippedAsIrrelevant: 0,
        debugLines: [],
      });
    }
  }

  private async processDailyCheck(vacancies: Vacancy[]): Promise<void> {
    logger.info("Running daily check mode");

    let newCount = 0;
    let relevantNewCount = 0;
    let notified = 0;
    let skippedAsKnown = 0;
    let skippedAsIrrelevant = 0;
    const debugLines: string[] = [];

    for (const vacancy of vacancies) {
      const exists = this.repository.existsByUrl(vacancy.url);

      if (exists) {
        skippedAsKnown += 1;
        continue;
      }

      newCount += 1;

      const detailedDescription = await this.tryFetchDetails(vacancy.url);
      const enrichedVacancy: Vacancy = {
        ...vacancy,
        description: detailedDescription || vacancy.description,
      };

      const analysis = analyzeVacancy(enrichedVacancy);

      if (!analysis.isRelevant) {
        this.repository.save(enrichedVacancy, false, null);
        skippedAsIrrelevant += 1;

        logger.info("New vacancy is not relevant", {
          title: enrichedVacancy.title,
          url: enrichedVacancy.url,
          reason: analysis.reason,
        });

        if (env.debugMode) {
          debugLines.push(
            `SKIP: ${enrichedVacancy.title} -> ${analysis.reason}`,
          );
        }

        continue;
      }

      relevantNewCount += 1;
      const notifiedAt = new Date().toISOString();

      try {
        await this.telegramClient.sendNewVacancyMessage({
          title: enrichedVacancy.title,
          company: enrichedVacancy.company,
          url: enrichedVacancy.url,
          matchSummary: analysis.matchSummary,
        });

        this.repository.save(enrichedVacancy, true, notifiedAt);
        notified += 1;

        logger.info("Telegram notification sent", {
          title: enrichedVacancy.title,
          company: enrichedVacancy.company,
          url: enrichedVacancy.url,
          matchSummary: analysis.matchSummary,
        });
      } catch (error) {
        logger.error("Failed to send Telegram message", {
          title: enrichedVacancy.title,
          url: enrichedVacancy.url,
          error: error instanceof Error ? error.message : String(error),
        });

        this.repository.save(enrichedVacancy, true, null);
      }
    }

    logger.info("Daily check finished", {
      totalFetched: vacancies.length,
      newCount,
      relevantNewCount,
      notified,
      skippedAsKnown,
      skippedAsIrrelevant,
    });

    if (env.summaryEveryRun) {
      await this.safeSendSummary({
        totalFetched: vacancies.length,
        newCount,
        relevantNewCount,
        notified,
        skippedAsKnown,
        skippedAsIrrelevant,
        debugLines,
      });
    }
  }

  private async tryFetchDetails(url: string): Promise<string> {
    try {
      return await this.douClient.fetchVacancyDetails(url);
    } catch (error) {
      logger.warn(
        "Failed to fetch vacancy details, using listing description",
        {
          url,
          error: error instanceof Error ? error.message : String(error),
        },
      );

      return "";
    }
  }

  private async safeSendSummary(params: {
    totalFetched: number;
    newCount: number;
    relevantNewCount: number;
    notified: number;
    skippedAsKnown: number;
    skippedAsIrrelevant: number;
    debugLines: string[];
  }): Promise<void> {
    try {
      await this.telegramClient.sendSummaryMessage(params);
    } catch (error) {
      logger.error("Failed to send summary message", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
