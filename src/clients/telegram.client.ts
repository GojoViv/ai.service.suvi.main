import TelegramBot from "node-telegram-bot-api";

import { TELEGRAM_BOT_TOKEN } from "../config/environment";
import logger from "../utils/logger";
import { ExternalServiceError } from "../utils/errors";

if (!TELEGRAM_BOT_TOKEN) {
  throw new ExternalServiceError("TELEGRAM_BOT_TOKEN is not defined");
}

const telegramClient = new TelegramBot(TELEGRAM_BOT_TOKEN, {
  polling: true,
});

// Basic error handling
telegramClient.on("polling_error", (error) => {
  logger.error({ message: "Polling error", error });
});

telegramClient.on("error", (error) => {
  logger.error({ message: "General error", error });
});

// Startup confirmation
telegramClient
  .getMe()
  .then((botInfo) => {
    logger.info({
      message: "Bot started successfully",
      username: botInfo.username,
    });
  })
  .catch((error) => {
    logger.error({ message: "Failed to get bot info", error });
  });

export { telegramClient };
