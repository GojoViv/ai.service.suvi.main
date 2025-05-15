import { Request, Response } from "express";
import {
  createProject,
  bulkCreateProjects,
  getProject,
  updateProject,
  archiveProject,
  updateProjectLinks,
  updateBoards,
  addCommunicationChannel,
  removeCommunicationChannel,
  updateClientInfo,
  addClientContact,
  updateDocumentation,
  findProjectsByStatus,
  findProjectsByClient,
  getAllProjectTags,
  getProjectStats,
} from "../../models/project/project.model";
import logger from "../../utils/logger";
import {
  NotFoundError,
  ValidationError,
  ExternalServiceError,
  asyncHandler,
} from "../../utils/errors";

// Create a new Project
const httpCreateProject = asyncHandler(async (req: Request, res: Response) => {
  const projectData = req.body;
  const newProject = await createProject(projectData);

  logger.info("Project created successfully", { projectTag: newProject.tag });
  return res.status(201).json(newProject);
});

const httpBulkCreateProjects = asyncHandler(
  async (req: Request, res: Response) => {
    const projects = req.body;

    // Validate input
    if (!Array.isArray(projects)) {
      logger.warn("Invalid bulk project creation input", { input: projects });
      throw new ValidationError("Input must be an array of projects", []);
    }

    // Validate each project has required fields
    const invalidProjects = projects.filter(
      (project) => !project.tag || !project.boards
    );

    if (invalidProjects.length > 0) {
      logger.warn("Invalid projects in bulk creation", { invalidProjects });
      throw new ValidationError("Input must be an array of projects", []);
    }

    const result = await bulkCreateProjects(projects);
    logger.info("Bulk project creation completed", { count: projects.length });
    return res.status(201).json({
      message: "Bulk project creation completed",
      ...result,
    });
  }
);

// Get a Project by tag
const httpGetProject = asyncHandler(async (req: Request, res: Response) => {
  const { tag } = req.params;
  const project = await getProject(tag);

  if (!project) {
    logger.warn("Project not found", { projectTag: tag });
    throw new NotFoundError("Project not found");
  }

  logger.info("Project retrieved successfully", { projectTag: tag });
  return res.status(200).json(project);
});

// Update a Project
const httpUpdateProject = asyncHandler(async (req: Request, res: Response) => {
  const { tag } = req.params;
  const updateData = req.body;
  const updatedProject = await updateProject(tag, updateData);

  if (!updatedProject) {
    logger.warn("Project not found for update", { projectTag: tag });
    throw new NotFoundError("Project not found");
  }

  logger.info("Project updated successfully", { projectTag: tag });
  return res.status(200).json(updatedProject);
});

// Archive a Project
const httpArchiveProject = asyncHandler(async (req: Request, res: Response) => {
  const { tag } = req.params;
  const archivedProject = await archiveProject(tag);

  if (!archivedProject) {
    logger.warn("Project not found for archiving", { projectTag: tag });
    throw new NotFoundError("Project not found");
  }

  logger.info("Project archived successfully", { projectTag: tag });
  return res.status(200).json(archivedProject);
});

// Update Project Links
const httpUpdateProjectLinks = asyncHandler(
  async (req: Request, res: Response) => {
    const { tag } = req.params;
    const links = req.body;
    const updatedProject = await updateProjectLinks(tag, links);

    if (!updatedProject) {
      logger.warn("Project not found for link update", { projectTag: tag });
      throw new NotFoundError("Project not found");
    }

    logger.info("Project links updated successfully", { projectTag: tag });
    return res.status(200).json(updatedProject);
  }
);

// Update Project Boards
const httpUpdateProjectBoards = asyncHandler(
  async (req: Request, res: Response) => {
    const { tag } = req.params;
    const boards = req.body;
    const updatedProject = await updateBoards(tag, boards);

    if (!updatedProject) {
      logger.warn("Project not found for board update", { projectTag: tag });
      throw new NotFoundError("Project not found");
    }

    logger.info("Project boards updated successfully", { projectTag: tag });
    return res.status(200).json(updatedProject);
  }
);

// Add Communication Channel
const httpAddCommunicationChannel = asyncHandler(
  async (req: Request, res: Response) => {
    const { tag } = req.params;
    const channelData = req.body;
    const updatedProject = await addCommunicationChannel(tag, channelData);

    if (!updatedProject) {
      logger.warn("Project not found for channel addition", {
        projectTag: tag,
      });
      throw new NotFoundError("Project not found");
    }

    logger.info("Communication channel added successfully", {
      projectTag: tag,
    });
    return res.status(200).json(updatedProject);
  }
);

// Remove Communication Channel
const httpRemoveCommunicationChannel = asyncHandler(
  async (req: Request, res: Response) => {
    const { tag, channelId } = req.params;
    const { direction } = req.body;
    const updatedProject = await removeCommunicationChannel(
      tag,
      channelId,
      direction
    );

    logger.info("Communication channel removed successfully", {
      projectTag: tag,
      channelId,
    });
    return res.status(200).json(updatedProject);
  }
);

// Update Client Info
const httpUpdateClientInfo = asyncHandler(
  async (req: Request, res: Response) => {
    const { tag } = req.params;
    const clientData = req.body;
    const updatedProject = await updateClientInfo(tag, clientData);

    if (!updatedProject) {
      logger.warn("Project not found for client info update", {
        projectTag: tag,
      });
      throw new NotFoundError("Project not found");
    }

    logger.info("Client info updated successfully", { projectTag: tag });
    return res.status(200).json(updatedProject);
  }
);

// Add Client Contact
const httpAddClientContact = asyncHandler(
  async (req: Request, res: Response) => {
    const { tag } = req.params;
    const contactData = req.body;
    const updatedProject = await addClientContact(tag, contactData);

    if (!updatedProject) {
      logger.warn("Project not found for contact addition", {
        projectTag: tag,
      });
      throw new NotFoundError("Project not found");
    }

    logger.info("Client contact added successfully", { projectTag: tag });
    return res.status(200).json(updatedProject);
  }
);

// Get Projects by Status
const httpGetProjectsByStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = req.params;
    const projects = await findProjectsByStatus(status);

    logger.info("Projects by status retrieved successfully", {
      status,
      count: projects.length,
    });
    return res.status(200).json(projects);
  }
);

// Get Projects by Client
const httpGetProjectsByClient = asyncHandler(
  async (req: Request, res: Response) => {
    const { clientId } = req.params;
    const projects = await findProjectsByClient(clientId);

    logger.info("Projects by client retrieved successfully", {
      clientId,
      count: projects.length,
    });
    return res.status(200).json(projects);
  }
);

// Get Project Stats
const httpGetProjectStats = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await getProjectStats();

    logger.info("Project stats retrieved successfully");
    return res.status(200).json(stats);
  }
);

// Get All Project Tags
const httpGetAllProjectTags = asyncHandler(
  async (req: Request, res: Response) => {
    const tags = await getAllProjectTags();

    logger.info("All project tags retrieved successfully", {
      count: tags.length,
    });
    return res.status(200).json(tags);
  }
);

export {
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
};
