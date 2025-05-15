// Importing Express types and permission model functions
import { Request, Response } from "express";
import {
  createPermission,
  getAllPermissions,
  getPermissionById,
  getPermissionsByResource,
  updatePermissionById,
  deletePermissionById,
} from "../../models/permission/permission.model"; // Adjust the import path as necessary
import logger from "../../utils/logger";
import {
  NotFoundError,
  ValidationError,
  ExternalServiceError,
  asyncHandler,
} from "../../utils/errors";

// Create a new Permission
const httpCreatePermission = asyncHandler(
  async (req: Request, res: Response) => {
    const permissionData = req.body;
    const existingPermission = await createPermission(permissionData);

    logger.info("Permission created successfully", {
      permissionId: existingPermission._id,
    });
    return res.status(201).json(existingPermission);
  }
);

// Get all Permissions
const httpGetAllPermissions = asyncHandler(
  async (req: Request, res: Response) => {
    const permissions = await getAllPermissions();

    logger.info("All permissions retrieved successfully", {
      count: permissions.length,
    });
    return res.status(200).json(permissions);
  }
);

// Get a Permission by ID
const httpGetPermissionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const permission = await getPermissionById(id);

    if (!permission) {
      logger.warn("Permission not found", { permissionId: id });
      throw new NotFoundError("Permission not found");
    }

    logger.info("Permission retrieved successfully", { permissionId: id });
    return res.status(200).json(permission);
  }
);

// Get Permissions by Resource
const httpGetPermissionsByResource = asyncHandler(
  async (req: Request, res: Response) => {
    const { resource } = req.query;

    if (typeof resource !== "string") {
      logger.warn("Invalid resource parameter", { resource });
      throw new ValidationError("Invalid or missing 'resource' parameter", []);
    }

    const permissions = await getPermissionsByResource(resource);
    logger.info("Permissions by resource retrieved successfully", {
      resource,
      count: permissions.length,
    });
    return res.status(200).json(permissions);
  }
);

// Update a Permission by ID
const httpUpdatePermissionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    const updatedPermission = await updatePermissionById(id, updateData);

    if (!updatedPermission) {
      logger.warn("Permission not found for update", { permissionId: id });
      throw new NotFoundError("Permission not found");
    }

    logger.info("Permission updated successfully", { permissionId: id });
    return res.status(200).json(updatedPermission);
  }
);

// Delete a Permission by ID
const httpDeletePermissionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const deletedPermission = await deletePermissionById(id);

    if (!deletedPermission) {
      logger.warn("Permission not found for deletion", { permissionId: id });
      throw new NotFoundError("Permission not found");
    }

    logger.info("Permission deleted successfully", { permissionId: id });
    return res.status(204).send();
  }
);

// Exporting controller functions
export {
  httpCreatePermission,
  httpGetAllPermissions,
  httpGetPermissionById,
  httpGetPermissionsByResource,
  httpUpdatePermissionById,
  httpDeletePermissionById,
};
