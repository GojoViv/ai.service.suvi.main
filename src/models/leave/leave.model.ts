// Importing necessary dependencies
import { Leave } from "./leave.schema"; // Adjust the import path as necessary
import { ILeave } from "../../types"; // Adjust the import path as necessary
import logger from "../../utils/logger";
import { ExternalServiceError } from "../../utils/errors";

// Create a new Leave Request
const createLeaveRequest = async (
  leaveData: Partial<ILeave>
): Promise<ILeave> => {
  try {
    const leave = await Leave.create(leaveData);
    logger.info({ message: "Leave request created", leave });
    return leave;
  } catch (error) {
    logger.error({ message: "Error creating leave request", error });
    throw new ExternalServiceError("Error creating leave request");
  }
};

// Get a Leave Request by ID
const getLeaveRequestById = async (id: string): Promise<ILeave | null> => {
  try {
    const leave = await Leave.findById(id);
    logger.info({ message: "Fetched leave request by ID", id, leave });
    return leave;
  } catch (error) {
    logger.error({ message: "Error fetching leave request by ID", id, error });
    throw new ExternalServiceError("Error fetching leave request by ID");
  }
};

// Get Leave Requests by Status
const getLeaveRequestsByStatus = async (
  status: "Pending" | "Approved" | "Rejected"
): Promise<ILeave[]> => {
  try {
    const leaves = await Leave.find({ status });
    logger.info({
      message: "Fetched leave requests by status",
      status,
      count: leaves.length,
    });
    return leaves;
  } catch (error) {
    logger.error({
      message: "Error fetching leave requests by status",
      status,
      error,
    });
    throw new ExternalServiceError("Error fetching leave requests by status");
  }
};

// Update a Leave Request by ID
const updateLeaveRequestById = async (
  id: string,
  updateData: Partial<ILeave>,
  options = { new: true }
): Promise<ILeave | null> => {
  try {
    const updatedLeave = await Leave.findByIdAndUpdate(id, updateData, options);
    logger.info({ message: "Updated leave request", id, updatedLeave });
    return updatedLeave;
  } catch (error) {
    logger.error({ message: "Error updating leave request", id, error });
    throw new ExternalServiceError("Error updating leave request");
  }
};

// Delete a Leave Request by ID
const deleteLeaveRequestById = async (id: string): Promise<ILeave | null> => {
  try {
    const deletedLeave = await Leave.findByIdAndDelete(id);
    logger.info({ message: "Deleted leave request", id, deletedLeave });
    return deletedLeave;
  } catch (error) {
    logger.error({ message: "Error deleting leave request", id, error });
    throw new ExternalServiceError("Error deleting leave request");
  }
};

// Exporting functions
export {
  createLeaveRequest,
  getLeaveRequestById,
  getLeaveRequestsByStatus,
  updateLeaveRequestById,
  deleteLeaveRequestById,
};
