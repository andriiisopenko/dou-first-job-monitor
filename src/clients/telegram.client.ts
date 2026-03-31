import { env } from "../config/env";

export class TelegramClient {
  private readonly token: string;
  private readonly chatId: string;

  constructor() {
    this.token = env.telegramBotToken;
    this.chatId = env.telegramChatId;
  }

  async sendNewVacancyMessage(params: {
    title: string;
    company: string;
    url: string;
  }): Promise<void> {
    const text = [
      "Нова вакансія",
      `Назва: ${params.title}`,
      `Компанія: ${params.company}`,
      `URL: ${params.url}`,
    ].join("\n");

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
}
