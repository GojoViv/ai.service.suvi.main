import { Router } from "express";
import {
  httpGetTasksByStatus,
  httpGetTasksByAssignee,
  httpGetTasksByPriority,
  httpGetSprintsByTotalTasks,
  httpGetProjectsByOwner,
  httpGetSprintsByCompletionRate,
  httpGetTasksByProject,
  httpGetTaskCompletionByAssignee,
  httpGetProjectCompletionBySprint,
  httpGetAllEntries,
  httpGetAllEmployees,
} from "./notion.controller";

const notionRouter = Router();

notionRouter.get("/tasks/status", httpGetTasksByStatus);
notionRouter.get("/tasks/assignee", httpGetTasksByAssignee);
notionRouter.get("/tasks/priority", httpGetTasksByPriority);
notionRouter.get("/sprints/total-tasks", httpGetSprintsByTotalTasks);
notionRouter.get("/projects/owner", httpGetProjectsByOwner);
notionRouter.get("/sprints/completion-rate", httpGetSprintsByCompletionRate);
notionRouter.get("/tasks/project", httpGetTasksByProject);
notionRouter.get("/tasks/completion/assignee", httpGetTaskCompletionByAssignee);
notionRouter.get(
  "/projects/completion/sprint",
  httpGetProjectCompletionBySprint
);
notionRouter.get("/tasks", httpGetAllEntries);
notionRouter.get("/employees", httpGetAllEmployees);
notionRouter.get("/getAllEntries", httpGetAllEmployees);

export { notionRouter };
