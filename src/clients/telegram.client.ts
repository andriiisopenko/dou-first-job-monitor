import { env } from "../config/env";

export class TelegramClient {
  private readonly token: string;
  private readonly chatId: string;

  constructor() {
    this.token = env.telegramBotToken;
    this.chatId = env.telegramChatId;
  }

  async sendMessage(text: string): Promise<void> {
    const response = await fetch(
      `https://api.telegram.org/bot${this.token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          disable_web_page_preview: false,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Telegram API error: ${response.status} ${body}`);
    }
  }

  async sendNewVacancyMessage(params: {
    title: string;
    company: string;
    url: string;
    matchSummary: string;
  }): Promise<void> {
    const text = [
      "Нова вакансія",
      "",
      `Назва: ${params.title}`,
      `Компанія: ${params.company}`,
      `Збіг: ${params.matchSummary || "matched rules"}`,
      `URL: ${params.url}`,
    ].join("\n");

    await this.sendMessage(text);
  }

  async sendHeartbeatMessage(): Promise<void> {
    const text = ["Монітор запущено", `Час: ${new Date().toISOString()}`].join(
      "\n",
    );

    await this.sendMessage(text);
  }

  async sendSummaryMessage(params: {
    totalFetched: number;
    newCount: number;
    relevantNewCount: number;
    notified: number;
    skippedAsKnown: number;
    skippedAsIrrelevant: number;
    debugLines?: string[];
  }): Promise<void> {
    const lines = [
      "Підсумок перевірки",
      "",
      `Перевірено вакансій: ${params.totalFetched}`,
      `Нових вакансій: ${params.newCount}`,
      `Нових релевантних: ${params.relevantNewCount}`,
      `Надіслано в Telegram: ${params.notified}`,
      `Пропущено як уже відомі: ${params.skippedAsKnown}`,
      `Пропущено як нерелевантні: ${params.skippedAsIrrelevant}`,
    ];

    if (params.debugLines && params.debugLines.length > 0) {
      lines.push("", "Debug:");
      lines.push(...params.debugLines.slice(0, 10));
    }

    await this.sendMessage(lines.join("\n"));
  }
}
