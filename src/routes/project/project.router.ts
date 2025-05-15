import express from "express";
import {
  httpCreateProject,
  httpBulkCreateProjects,
  httpGetProject,
  httpUpdateProject,
  httpArchiveProject,
  httpUpdateProjectLinks,
  httpUpdateProjectBoards,
  httpAddCommunicationChannel,
  httpRemoveCommunicationChannel,
  httpUpdateClientInfo,
  httpAddClientContact,
  httpGetProjectsByStatus,
  httpGetProjectsByClient,
  httpGetProjectStats,
  httpGetAllProjectTags,
} from "./project.controller";

// Optional: Import middleware if you have authentication/validation
// import { authenticate, validateProjectInput } from '../middleware';

const projectRouter = express.Router();

// Base project operations
projectRouter.post("/", httpCreateProject);
projectRouter.post("/bulk", httpBulkCreateProjects);

projectRouter.get("/tag/:tag", httpGetProject);
projectRouter.patch("/tag/:tag", httpUpdateProject);
projectRouter.post("/tag/:tag/archive", httpArchiveProject);

// Project links
projectRouter.patch("/tag/:tag/links", httpUpdateProjectLinks);

// Project boards
projectRouter.patch("/tag/:tag/boards", httpUpdateProjectBoards);

// Communication channels
projectRouter.post("/tag/:tag/channels", httpAddCommunicationChannel);
projectRouter.delete(
  "/tag/:tag/channels/:channelId",
  httpRemoveCommunicationChannel
);

// Client management
projectRouter.patch("/tag/:tag/client", httpUpdateClientInfo);
projectRouter.post("/tag/:tag/client/contacts", httpAddClientContact);

// Queries and filters
projectRouter.get("/status", httpGetProjectsByStatus);
projectRouter.get("/client", httpGetProjectsByClient);

// Analytics and metadata
projectRouter.get("/stats", httpGetProjectStats);
projectRouter.get("/tags", httpGetAllProjectTags);

export { projectRouter };
