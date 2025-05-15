import { Project } from "./project.schema";
import logger from "../../utils/logger";
import { ExternalServiceError } from "../../utils/errors";

const createProject = async (projectData: any) => {
  try {
    const project = new Project({
      tag: projectData.tag,
      name: projectData.name,
      boards: projectData.boards,
      status: "active",
    });
    const savedProject = await project.save();
    logger.info(
      `Project created successfully. Project ID: ${savedProject._id}`
    );
    return savedProject;
  } catch (error: any) {
    logger.error(`Failed to create project: ${error.message}`);
    throw new ExternalServiceError(
      `Failed to create project: ${error.message}`
    );
  }
};

const bulkCreateProjects = async (projects: any[]) => {
  try {
    const result = await Project.insertMany(projects, {
      ordered: false, // Continues inserting even if some documents fail
      rawResult: true, // Returns detailed info about the operation
    });

    logger.info(
      `${result.insertedCount} projects inserted successfully. Total projects: ${projects.length}`
    );
    return {
      success: result.insertedCount,
      total: projects.length,
      failed: projects.length - result.insertedCount,
      insertedIds: result.insertedIds,
    };
  } catch (error: any) {
    if (error.name === "BulkWriteError") {
      logger.error(
        `Bulk insert failed. Successfully inserted ${error.insertedDocs.length} documents. Total projects: ${projects.length}`
      );
      return {
        success: error.insertedDocs.length,
        total: projects.length,
        failed: projects.length - error.insertedDocs.length,
        errors: error.writeErrors,
        insertedDocs: error.insertedDocs,
      };
    }
    logger.error(`Failed to bulk insert projects: ${error.message}`);
    throw error;
  }
};

const getProject = async (tag: any) => {
  try {
    const project = await Project.findOne({ tag });
    if (project) {
      logger.info(`Project fetched successfully. Project ID: ${project._id}`);
    } else {
      logger.info(`Project not found. Tag: ${tag}`);
    }
    return project;
  } catch (error: any) {
    logger.error(`Failed to fetch project: ${error.message}`);
    throw new ExternalServiceError(`Failed to fetch project: ${error.message}`);
  }
};

const updateProject = async (tag: any, updateData: any) => {
  try {
    const updatedProject = await Project.findOneAndUpdate(
      { tag },
      { $set: updateData },
      { new: true }
    );
    if (updatedProject) {
      logger.info(
        `Project updated successfully. Project ID: ${updatedProject._id}`
      );
    } else {
      logger.info(`Project not found. Tag: ${tag}`);
    }
    return updatedProject;
  } catch (error: any) {
    logger.error(`Failed to update project: ${error.message}`);
    throw new ExternalServiceError(
      `Failed to update project: ${error.message}`
    );
  }
};

const archiveProject = async (tag: any) => {
  try {
    const updatedProject = await Project.findOneAndUpdate(
      { tag },
      { $set: { status: "completed" } },
      { new: true }
    );
    if (updatedProject) {
      logger.info(
        `Project archived successfully. Project ID: ${updatedProject._id}`
      );
    } else {
      logger.info(`Project not found. Tag: ${tag}`);
    }
    return updatedProject;
  } catch (error: any) {
    logger.error(`Failed to archive project: ${error.message}`);
    throw new ExternalServiceError(
      `Failed to archive project: ${error.message}`
    );
  }
};

// LINK MANAGEMENT
const updateProjectLinks = async (tag: any, links: any) => {
  try {
    const updatedProject = await Project.findOneAndUpdate(
      { tag },
      {
        $set: {
          "links.design.internal": links.design?.internal,
          "links.design.client": links.design?.client,
          "links.deployment.staging": links.deployment?.staging,
          "links.deployment.production": links.deployment?.production,
        },
      },
      { new: true }
    );
    if (updatedProject) {
      logger.info(
        `Project links updated successfully. Project ID: ${updatedProject._id}`
      );
    } else {
      logger.info(`Project not found. Tag: ${tag}`);
    }
    return updatedProject;
  } catch (error: any) {
    logger.error(`Failed to update project links: ${error.message}`);
    throw new ExternalServiceError(
      `Failed to update project links: ${error.message}`
    );
  }
};

// BOARD MANAGEMENT
const updateBoards = async (tag: any, boards: any) => {
  try {
    const updatedProject = await Project.findOneAndUpdate(
      { tag },
      { $set: { boards } },
      { new: true }
    );
    if (updatedProject) {
      logger.info(
        `Project boards updated successfully. Project ID: ${updatedProject._id}`
      );
    } else {
      logger.info(`Project not found. Tag: ${tag}`);
    }
    return updatedProject;
  } catch (error: any) {
    logger.error(`Failed to update boards: ${error.message}`);
    throw new ExternalServiceError(`Failed to update boards: ${error.message}`);
  }
};

// COMMUNICATION CHANNEL MANAGEMENT
const addCommunicationChannel = async (tag: any, channelData: any) => {
  try {
    const direction =
      channelData.purpose === "internal" ? "internal" : "external";
    const updatedProject = await Project.findOneAndUpdate(
      { tag },
      {
        $push: {
          [`communication.channels.${direction}`]: channelData,
        },
      },
      { new: true }
    );
    if (updatedProject) {
      logger.info(
        `Communication channel added successfully. Project ID: ${updatedProject._id}`
      );
    } else {
      logger.info(`Project not found. Tag: ${tag}`);
    }
    return updatedProject;
  } catch (error: any) {
    logger.error(`Failed to add communication channel: ${error.message}`);
    throw new ExternalServiceError(
      `Failed to add communication channel: ${error.message}`
    );
  }
};

const removeCommunicationChannel = async (
  tag: any,
  channelId: any,
  direction: any
) => {
  try {
    const updatedProject = await Project.findOneAndUpdate(
      { tag },
      {
        $pull: {
          [`communication.channels.${direction}`]: {
            identifier: channelId,
          },
        },
      },
      { new: true }
    );
  } catch (error: any) {
    throw new Error(`Failed to remove communication channel: ${error.message}`);
  }
};

// CLIENT MANAGEMENT
const updateClientInfo = async (tag: any, clientData: any) => {
  try {
    return await Project.findOneAndUpdate(
      { tag },
      { $set: { client: clientData } },
      { new: true }
    );
  } catch (error: any) {
    throw new Error(`Failed to update client info: ${error.message}`);
  }
};

const addClientContact = async (tag: any, contactData: any) => {
  try {
    return await Project.findOneAndUpdate(
      { tag },
      { $push: { "client.contacts": contactData } },
      { new: true }
    );
  } catch (error: any) {
    throw new Error(`Failed to add client contact: ${error.message}`);
  }
};

// DOCUMENTATION MANAGEMENT
const updateDocumentation = async (tag: any, docType: any, data: any) => {
  try {
    const updatePath = `documentation.${docType}`;
    return await Project.findOneAndUpdate(
      { tag },
      {
        $set: {
          [updatePath]: {
            ...data,
            lastUpdated: new Date(),
          },
        },
      },
      { new: true }
    );
  } catch (error: any) {
    throw new Error(`Failed to update documentation: ${error.message}`);
  }
};

// QUERY & FILTERING OPERATIONS
const findProjectsByStatus = async (status: any) => {
  try {
    return await Project.find({ status });
  } catch (error: any) {
    throw new Error(`Failed to fetch projects by status: ${error.message}`);
  }
};

const findProjectsByClient = async (clientName: any) => {
  try {
    return await Project.find({ "client.name": clientName });
  } catch (error: any) {
    throw new Error(`Failed to fetch projects by client: ${error.message}`);
  }
};

const findProjectsByIntegration = async (integrationType: any) => {
  try {
    return await Project.find({
      [`metadata.integrations.${integrationType}`]: true,
    });
  } catch (error: any) {
    throw new Error(
      `Failed to fetch projects by integration: ${error.message}`
    );
  }
};

// METADATA & ANALYTICS
const updateMetadata = async (tag: any, metadata: any) => {
  try {
    return await Project.findOneAndUpdate(
      { tag },
      {
        $set: {
          metadata: {
            ...metadata,
            lastProcessed: new Date(),
          },
        },
      },
      { new: true }
    );
  } catch (error: any) {
    throw new Error(`Failed to update metadata: ${error.message}`);
  }
};

const addProjectTags = async (tag: any, newTags: any) => {
  try {
    return await Project.findOneAndUpdate(
      { tag },
      { $addToSet: { "metadata.tags": { $each: newTags } } },
      { new: true }
    );
  } catch (error: any) {
    throw new Error(`Failed to add project tags: ${error.message}`);
  }
};

// UTILITY FUNCTIONS
const getAllProjectTags = async () => {
  try {
    return await Project.distinct("metadata.tags");
  } catch (error: any) {
    throw new Error(`Failed to fetch project tags: ${error.message}`);
  }
};

const getProjectStats = async () => {
  try {
    return await Project.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
  } catch (error: any) {
    throw new Error(`Failed to fetch project stats: ${error.message}`);
  }
};

export {
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
  findProjectsByIntegration,
  updateMetadata,
  addProjectTags,
  getAllProjectTags,
  getProjectStats,
};
