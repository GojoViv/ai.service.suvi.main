// Importing dependencies and role management functions
import { Request, Response } from "express";
import {
  createRole,
  getAllRoles,
  getRoleByName,
  getRoleById,
  updateRoleById,
  addPermissionToRole,
  removePermissionFromRole,
  deleteRoleById,
} from "../../models/role/role.model"; // Adjust the import path as necessary
import logger from "../../utils/logger";
import {
  NotFoundError,
  ValidationError,
  asyncHandler,
} from "../../utils/errors";

// HTTP handler to create a new Role
const httpCreateRole = asyncHandler(async (req: Request, res: Response) => {
  const roleData = req.body;
  const role = await createRole(roleData);

  logger.info("Role created successfully", {
    roleId: role.id,
  });
  return res.status(201).json(role);
});

// HTTP handler to get all Roles
const httpGetAllRoles = asyncHandler(async (req: Request, res: Response) => {
  const roles = await getAllRoles();

  logger.info("All roles retrieved successfully", { count: roles.length });
  return res.status(200).json(roles);
});

// HTTP handler to get a Role by Name
const httpGetRoleByName = asyncHandler(async (req: Request, res: Response) => {
  const { roleName } = req.params;
  const role = await getRoleByName(roleName);

  if (!role) {
    logger.warn("Role not found by name", { roleName });
    throw new NotFoundError("Role not found");
  }

  logger.info("Role retrieved by name successfully", { roleName });
  return res.status(200).json(role);
});

// HTTP handler to get a Role by ID
const httpGetRoleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const role = await getRoleById(id);

  if (!role) {
    logger.warn("Role not found by ID", { roleId: id });
    throw new NotFoundError("Role not found");
  }

  logger.info("Role retrieved by ID successfully", { roleId: id });
  return res.status(200).json(role);
});

// HTTP handler to update a Role by ID
const httpUpdateRoleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const updatedRole = await updateRoleById(id, updateData);

  if (!updatedRole) {
    logger.warn("Role not found for update", { roleId: id });
    throw new NotFoundError("Role not found");
  }

  logger.info("Role updated successfully", { roleId: id });
  return res.status(200).json(updatedRole);
});

// HTTP handler to add a Permission to a Role
const httpAddPermissionToRole = asyncHandler(
  async (req: Request, res: Response) => {
    const { roleId } = req.params;
    const permissionData = req.body;
    const updatedRole = await addPermissionToRole(roleId, permissionData);

    if (!updatedRole) {
      logger.warn("Role not found for permission addition", { roleId });
      throw new NotFoundError("Role not found");
    }

    logger.info("Permission added to role successfully", {
      roleId,
      permissionId: permissionData.id,
    });
    return res.status(200).json(updatedRole);
  }
);

// HTTP handler to remove a Permission from a Role
const httpRemovePermissionFromRole = asyncHandler(
  async (req: Request, res: Response) => {
    const { roleId, permissionId } = req.params;
    const updatedRole = await removePermissionFromRole(roleId, permissionId);

    if (!updatedRole) {
      logger.warn("Role not found for permission removal", { roleId });
      throw new NotFoundError("Role not found");
    }

    logger.info("Permission removed from role successfully", {
      roleId,
      permissionId,
    });
    return res.status(200).json(updatedRole);
  }
);

// HTTP handler to delete a Role by ID
const httpDeleteRoleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deletedRole = await deleteRoleById(id);

  if (!deletedRole) {
    logger.warn("Role not found for deletion", { roleId: id });
    throw new NotFoundError("Role not found");
  }

  logger.info("Role deleted successfully", { roleId: id });
  return res.status(204).send();
});

// Exporting the controller functions
export {
  httpCreateRole,
  httpGetAllRoles,
  httpGetRoleByName,
  httpGetRoleById,
  httpUpdateRoleById,
  httpAddPermissionToRole,
  httpRemovePermissionFromRole,
  httpDeleteRoleById,
};
