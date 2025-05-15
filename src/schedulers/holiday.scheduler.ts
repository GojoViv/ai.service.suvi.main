import { scheduleJob } from "node-schedule";

import logger from "../utils/logger";
import { ExternalServiceError } from "../utils/errors";

export const holidayScheduler = async () => {
  try {
    logger.info("Starting holiday data sync");
  } catch (error) {
    logger.error("Holiday data sync failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new ExternalServiceError("Failed to sync holiday data");
  }
};

// Schedule the job to run every day at 3 AM
scheduleJob("0 3 * * *", holidayScheduler);
