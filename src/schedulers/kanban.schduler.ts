import { scheduleJob } from "node-schedule";

import logger from "../utils/logger";
import { ExternalServiceError } from "../utils/errors";
import {
  // dailyPerformanceUpdates,
  getAllProjectsFridayMetrics,
  sprintAnalysis,
  getRankListForQaDoneAndBugsCreatedStoryPoints,
  getBugsRankList,
  financialAnalyses,
  qaAnalysis,
} from "../services/kanban/kanban.service";
import { processBoard } from "../services/notion/notion.service";
import { syncEmployeesFromNotion } from "../utils/syncNotionEmployeeDirectory";
import { getAllEntries } from "../models/notion/notion.model";
import { updateAllProjectPRDs } from "../services/kanban/projectData.service";
import { syncNotionLeaves } from "../services/kanban/employee.service";
import { checkTodaysLeaves } from "../services/kanban/employee.service";

export const kanbanScheduler = async () => {
  try {
    logger.info("Starting Kanban data sync");
  } catch (error) {
    logger.error("Kanban data sync failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new ExternalServiceError("Failed to sync Kanban data");
  }
};

// Schedule the job to run every hour
scheduleJob("0 * * * *", kanbanScheduler);

export const updateKanbanBoard = () => {
  const times = ["30 8 * * *", "0 13 * * *", "0 17 * * *"];

  times.forEach((schedule) => {
    scheduleJob(schedule, async () => {
      try {
        console.log("[INFO] Starting Kanban updation...");
        await processBoard();
        console.log("[INFO] Completed Kanban updation...");
      } catch (error) {
        console.log("[ERROR] Error while running the job: ", error);
      }
    });
  });
};

export const endOfSprintAnalysis = () => {
  scheduleJob("30 9 * * 1", async () => {
    try {
      console.log("[INFO] Starting Sprint Analysis...");

      await getAllProjectsFridayMetrics();
      await getRankListForQaDoneAndBugsCreatedStoryPoints();
      await getBugsRankList();
      await financialAnalyses();

      console.log("[INFO] Completed Sprint Analysis...");
    } catch (error) {
      console.log("[ERROR] Error while running the job: ", error);
    }
  });
};

export const postDailySprintAnalysis = () => {
  scheduleJob("0 9 * * 1-5", async () => {
    try {
      console.log("[INFO] Starting Sprint Analysis...");
      await sprintAnalysis();
      console.log("[INFO] Completed Sprint Analysis...");

      console.log("[INFO] Starting Employees Sync From Notion...");
      await syncEmployeesFromNotion();
      console.log("[INFO] Completed Employees Sync From Notion...");

      console.log("[INFO] Starting Employees Leave Sync From Notion...");
      await syncNotionLeaves();
      console.log("[INFO] Completed Employees Leaves Sync From Notion...");

      console.log("[INFO] Starting Employees Leaves today...");
      await checkTodaysLeaves();
      console.log("[INFO] Completed Employees Leaves today...");
    } catch (error) {
      console.log("[ERROR] Error while running the job: ", error);
    }
  });
};

export const postDailySprintAnalysisEvening = () => {
  scheduleJob("0 17 * * 1-5", async () => {
    try {
      console.log("[INFO] Starting QA Analysis...");
      await qaAnalysis();
      console.log("[INFO] Completed QA Analysis...");

      console.log("[INFO] Starting update of Project PRDs...");
      await updateAllProjectPRDs();
      console.log("[INFO] Completed update of Project PRDs...");
    } catch (error) {
      console.log("[ERROR] Error while running the job: ", error);
    }
  });
};
