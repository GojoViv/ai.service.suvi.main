import { Request, Response } from "express";
import { generateNotionQueryResponse } from "../../services/chatbot/chatbot.service";
import {
  getTasksByStatus,
  getTasksByAssignee,
  getTasksByPriority,
  getSprintsByTotalTasks,
  getProjectsByOwner,
  getSprintsByCompletionRate,
  getTasksByProject,
  getTaskCompletionByAssignee,
  getProjectCompletionBySprint,
} from "../../services/slack/slack.service";
import { getAllEntries } from "../../models/notion/notion.model";
import { Boards } from "../../constants/boards";
import { LEAVE_DATABASE_ID } from "../../constants/config";
import logger from "../../utils/logger";
import { ExternalServiceError, asyncHandler } from "../../utils/errors";

export const httpGetTasksByStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const tasksByStatus = await getTasksByStatus();
    logger.info("Tasks by status retrieved successfully");
    res.json(tasksByStatus);
  }
);

export const httpGetTasksByAssignee = asyncHandler(
  async (req: Request, res: Response) => {
    const tasksByAssignee = await getTasksByAssignee();
    logger.info("Tasks by assignee retrieved successfully");
    res.json(tasksByAssignee);
  }
);

export const httpGetTasksByPriority = asyncHandler(
  async (req: Request, res: Response) => {
    const tasksByPriority = await getTasksByPriority();
    logger.info("Tasks by priority retrieved successfully");
    res.json(tasksByPriority);
  }
);

export const httpGetSprintsByTotalTasks = asyncHandler(
  async (req: Request, res: Response) => {
    const sprintsByTotalTasks = await getSprintsByTotalTasks();
    logger.info("Sprints by total tasks retrieved successfully");
    res.json(sprintsByTotalTasks);
  }
);

export const httpGetProjectsByOwner = asyncHandler(
  async (req: Request, res: Response) => {
    const projectsByOwner = await getProjectsByOwner();
    logger.info("Projects by owner retrieved successfully");
    res.json(projectsByOwner);
  }
);

export const httpGetSprintsByCompletionRate = asyncHandler(
  async (req: Request, res: Response) => {
    const sprintsByCompletionRate = await getSprintsByCompletionRate();
    logger.info("Sprints by completion rate retrieved successfully");
    res.json(sprintsByCompletionRate);
  }
);

export const httpGetTasksByProject = asyncHandler(
  async (req: Request, res: Response) => {
    const tasksByProject = await getTasksByProject();
    logger.info("Tasks by project retrieved successfully");
    res.json(tasksByProject);
  }
);

export const httpGetTaskCompletionByAssignee = asyncHandler(
  async (req: Request, res: Response) => {
    const taskCompletionByAssignee = await getTaskCompletionByAssignee();
    logger.info("Task completion by assignee retrieved successfully");
    res.json(taskCompletionByAssignee);
  }
);

export const httpGetProjectCompletionBySprint = asyncHandler(
  async (req: Request, res: Response) => {
    const projectCompletionBySprint = await getProjectCompletionBySprint();
    logger.info("Project completion by sprint retrieved successfully");
    res.json(projectCompletionBySprint);
  }
);

const httpGetAllEntries = asyncHandler(async (req: Request, res: Response) => {
  const entries = await getAllEntries(Boards.TASKS);
  logger.info("All entries retrieved successfully", { board: Boards.TASKS });
  res.json(entries);
});

const httpGetAllEmployees = asyncHandler(
  async (req: Request, res: Response) => {
    const employees = await getAllEntries(LEAVE_DATABASE_ID);
    logger.info("All employees retrieved successfully", {
      databaseId: LEAVE_DATABASE_ID,
    });
    res.json(employees);
  }
);

export { httpGetAllEntries, httpGetAllEmployees };
