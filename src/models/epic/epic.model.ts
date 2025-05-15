import { Epic } from "./epic.schema";
import { IEpic } from "../../types";
import logger from "../../utils/logger";
import { ExternalServiceError } from "../../utils/errors";

// Fetch epics by status
const getEpicsByStatus = async (status: string): Promise<any> => {
  try {
    return await Epic.find({ "status.name": status }).populate("tasks");
  } catch (err) {
    logger.error({ message: "Error fetching epics by status", error: err });
    throw new ExternalServiceError("Could not fetch epics by status");
  }
};

// Update epic by ID
const updateEpicById = async (
  id: string,
  updateData: Partial<IEpic>,
  options = { new: true }
): Promise<any> => {
  try {
    return await Epic.findByIdAndUpdate(id, updateData, options).populate(
      "tasks"
    );
  } catch (err) {
    logger.error({ message: "Error updating epic by ID", error: err });
    throw new ExternalServiceError("Could not update epic");
  }
};

// Delete epic by ID
const deleteEpicById = async (id: string): Promise<IEpic | null> => {
  try {
    return await Epic.findByIdAndDelete(id);
  } catch (err) {
    logger.error({ message: "Error deleting epic by ID", error: err });
    throw new ExternalServiceError("Could not delete epic");
  }
};

// Create a new epic
const createEpic = async (epicData: IEpic): Promise<any> => {
  try {
    const newEpic = new Epic(epicData);
    await newEpic.save();
    logger.info({ message: "Epic created successfully", epic: newEpic });
    return newEpic;
  } catch (err) {
    logger.error({ message: "Error creating epic", error: err });
    throw new ExternalServiceError("Could not create epic");
  }
};

// Fetch all epics
const getAllEpics = async (): Promise<any> => {
  try {
    return await Epic.find().populate("tasks");
  } catch (err) {
    logger.error({ message: "Error fetching all epics", error: err });
    throw new ExternalServiceError("Could not fetch epics");
  }
};

// Fetch epic by ID
const getEpicById = async (epicId: string): Promise<any> => {
  try {
    return await Epic.findById(epicId).populate("tasks");
  } catch (err) {
    logger.error({ message: "Error fetching epic by ID", error: err });
    throw new ExternalServiceError("Could not fetch epic");
  }
};

// Update epic by a unique EpicId field
const updateEpic = async (
  epicId: string,
  updateData: Partial<IEpic>
): Promise<any> => {
  try {
    return await Epic.findOneAndUpdate({ epicId }, updateData, {
      new: true,
    }).populate("tasks");
  } catch (err) {
    logger.error({ message: "Error updating epic", error: err });
    throw new ExternalServiceError("Could not update epic");
  }
};

// Delete epic by a unique EpicId field
const deleteEpic = async (epicId: string): Promise<IEpic | null> => {
  try {
    return await Epic.findOneAndDelete({ epicId });
  } catch (err) {
    logger.error({ message: "Error deleting epic", error: err });
    throw new ExternalServiceError("Could not delete epic");
  }
};

export {
  createEpic,
  getEpicById,
  getEpicsByStatus,
  updateEpicById,
  deleteEpicById,
  getAllEpics,
  updateEpic,
  deleteEpic,
};
