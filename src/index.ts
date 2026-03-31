import { env } from "./config/env";
import { DouClient } from "./clients/dou.client";
import { TelegramClient } from "./clients/telegram.client";
import { initDatabase } from "./db/database";
import { VacanciesRepository } from "./db/vacancies.repository";
import { MonitorService } from "./services/monitor.service";
import { logger } from "./utils/logger";

async function main(): Promise<void> {
  process.env.LOG_LEVEL = env.logLevel;

  initDatabase();

  const monitor = new MonitorService(
    new DouClient(),
    new VacanciesRepository(),
    new TelegramClient(),
  );

  await monitor.run();
}

main()
  .then(() => {
    logger.info("Process finished successfully");
    process.exit(0);
  })
  .catch((error: unknown) => {
    logger.error("Fatal error", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
