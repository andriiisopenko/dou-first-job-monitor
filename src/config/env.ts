import dotenv from "dotenv";

dotenv.config();

function getEnv(name: string, required = true): string {
  const value = process.env[name];
  if (required && (!value || value.trim() === "")) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

function getNumberEnv(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (!raw) return defaultValue;

  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return parsed;
}

export const env = {
  telegramBotToken: getEnv("TELEGRAM_BOT_TOKEN"),
  telegramChatId: getEnv("TELEGRAM_CHAT_ID"),
  douFirstJobUrl:
    getEnv("DOU_FIRST_JOB_URL", false) || "https://jobs.dou.ua/first-job/",
  databasePath: getEnv("DATABASE_PATH", false) || "./data/vacancies.db",
  logLevel: getEnv("LOG_LEVEL", false) || "info",
  httpTimeoutMs: getNumberEnv("HTTP_TIMEOUT_MS", 20000),
};
