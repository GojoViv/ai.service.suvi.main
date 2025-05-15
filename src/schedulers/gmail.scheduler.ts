import { scheduleJob } from "node-schedule";

import logger from "../utils/logger";
import { ExternalServiceError } from "../utils/errors";

export const gmailScheduler = async () => {
  try {
    logger.info("Starting Gmail data sync");
  } catch (error) {
    logger.error("Gmail data sync failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new ExternalServiceError("Failed to sync Gmail data");
  }
};

// Schedule the job to run every 15 minutes
scheduleJob("*/15 * * * *", gmailScheduler);
