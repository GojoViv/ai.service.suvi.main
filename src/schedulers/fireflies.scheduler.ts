import { scheduleJob } from "node-schedule";
import logger from "../utils/logger";
import { ExternalServiceError } from "../utils/errors";

export const firefliesScheduler = async () => {
  try {
    logger.info("Starting Fireflies data sync");
  } catch (error) {
    logger.error("Fireflies data sync failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new ExternalServiceError("Failed to sync Fireflies data");
  }
};

// Schedule the job to run every day at 2 AM
scheduleJob("0 2 * * *", firefliesScheduler);
