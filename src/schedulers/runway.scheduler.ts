import { scheduleJob } from "node-schedule";

import logger from "../utils/logger";
import { ExternalServiceError } from "../utils/errors";

export const runwayScheduler = async () => {
  try {
    logger.info("Starting Runway data sync");
  } catch (error) {
    logger.error("Runway data sync failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new ExternalServiceError("Failed to sync Runway data");
  }
};

// Schedule the job to run every day at 1 AM
scheduleJob("0 1 * * *", runwayScheduler);
