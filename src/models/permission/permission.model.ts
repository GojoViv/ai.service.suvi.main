// Importing necessary dependencies
import { PermissionModel } from "./permission.schema"; // Adjust the import path as necessary
import { IPermission } from "../../types"; // Adjust the import path as necessary
import logger from "../../utils/logger";
import { ExternalServiceError } from "../../utils/errors";

// Create a new Permission
const createPermission = async (
  permissionData: Partial<IPermission>
): Promise<IPermission> => {
  try {
    const permission = await PermissionModel.create(permissionData);
    logger.info({ message: "Permission created", permission });
    return permission;
  } catch (error) {
    logger.error({ message: "Error creating permission", error });
    throw new ExternalServiceError("Error creating permission");
  }
};

// Get all Permissions
const getAllPermissions = async (): Promise<IPermission[]> => {
  try {
    const permissions = await PermissionModel.find({});
    logger.info({
      message: "Retrieved all permissions",
      count: permissions.length,
    });
    return permissions;
  } catch (error) {
    logger.error({ message: "Error retrieving permissions", error });
    throw new ExternalServiceError("Error retrieving permissions");
  }
};

// Get a Permission by ID
const getPermissionById = async (id: string): Promise<IPermission | null> => {
  try {
    const permission = await PermissionModel.findById(id);
    logger.info({ message: "Fetched permission by ID", id, permission });
    return permission;
  } catch (error) {
    logger.error({ message: "Error fetching permission by ID", id, error });
    throw new ExternalServiceError("Error fetching permission by ID");
  }
};

// Get Permissions by Resource
const getPermissionsByResource = async (
  resource: string
): Promise<IPermission[]> => {
  try {
    const permissions = await PermissionModel.find({ resource });
    logger.info({
      message: "Fetched permissions by resource",
      resource,
      count: permissions.length,
    });
    return permissions;
  } catch (error) {
    logger.error({
      message: "Error fetching permissions by resource",
      resource,
      error,
    });
    throw new ExternalServiceError("Error fetching permissions by resource");
  }
};

// Update a Permission by ID
const updatePermissionById = async (
  id: string,
  updateData: Partial<IPermission>,
  options = { new: true }
): Promise<IPermission | null> => {
  try {
    const updatedPermission = await PermissionModel.findByIdAndUpdate(
      id,
      updateData,
      options
    );
    logger.info({ message: "Updated permission", id, updatedPermission });
    return updatedPermission;
  } catch (error) {
    logger.error({ message: "Error updating permission", id, error });
    throw new ExternalServiceError("Error updating permission");
  }
};

// Delete a Permission by ID
const deletePermissionById = async (
  id: string
): Promise<IPermission | null> => {
  try {
    const deletedPermission = await PermissionModel.findByIdAndDelete(id);
    logger.info({ message: "Deleted permission", id, deletedPermission });
    return deletedPermission;
  } catch (error) {
    logger.error({ message: "Error deleting permission", id, error });
    throw new ExternalServiceError("Error deleting permission");
  }
};

// Exporting functions
export {
  createPermission,
  getAllPermissions,
  getPermissionById,
  getPermissionsByResource,
  updatePermissionById,
  deletePermissionById,
};
