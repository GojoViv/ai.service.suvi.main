// Importing necessary dependencies and models

import { RoleModel } from "./role.schema";
import { PermissionModel } from "../permission/permission.schema";
import { PermissionActions } from "../../enums";

import { IRole, IPermission } from "../../types"; // Adjust import paths as necessary

// Create a new Role
const createRole = async (roleData: Partial<IRole>): Promise<IRole> => {
  return RoleModel.create(roleData);
};

// Get all Roles
const getAllRoles = async (): Promise<IRole[]> => {
  return RoleModel.find().populate("permissions");
}

// Get a Role by Name
const getRoleByName = async (roleName: string): Promise<IRole | null> => {
  return RoleModel.findOne({ roleName }).populate("permissions");
};

// Get a Role by ID
const getRoleById = async (id: string): Promise<IRole | null> => {
  return RoleModel.findById(id).populate("permissions");
};

// Update a Role by ID
const updateRoleById = async (
  id: string,
  updateData: Partial<IRole>,
  options = { new: true }
): Promise<IRole | null> => {
  return RoleModel.findByIdAndUpdate(id, updateData, options);
};

const addPermissionToRole = async (
  roleId: string,
  permissionData: Partial<IPermission>
): Promise<IRole | null> => {
  // Check if the permission already exists
  let permission = await PermissionModel.findOne({
    resource: permissionData.resource,
    action: permissionData.action,
  });

  // If the permission doesn't exist, create it
  if (!permission) {
    permission = await PermissionModel.create(permissionData);
  }

  // Add the permission's ID to the role's permissions array
  // This also prevents adding the same permission ID multiple times
  const updatedRole = await RoleModel.findByIdAndUpdate(
    roleId,
    { $addToSet: { permissions: permission._id } }, // Using $addToSet instead of $push to avoid duplicates
    { new: true, upsert: true }
  ).populate("permissions");

  return updatedRole;
};

// Remove Permission from Role
const removePermissionFromRole = async (
  roleId: string,
  permissionId: string
): Promise<IRole | null> => {
  return RoleModel.findByIdAndUpdate(
    roleId,
    { $pull: { permissions: permissionId } },
    { new: true }
  ).populate("permissions");
};

// Delete a Role by ID
const deleteRoleById = async (id: string): Promise<IRole | null> => {
  return RoleModel.findByIdAndDelete(id);
};

async function initializeRolesWithPermissions() {
  const predefinedRoles = [
    {
      roleName: "Administrator",
      resources: [
        "Dashboard",
        "UserAccounts",
        "Projects",
        "Tasks",
        "Analytics",
        "DataSets",
        "AIModels",
        "Messages",
        "Channels",
        "Invoices",
        "Payments",
        "AuditLogs",
        "ComplianceReports",
      ],
    },
    {
      roleName: "ProjectManager",
      resources: ["Projects", "Tasks", "Analytics"],
    },
    {
      roleName: "DataScientist",
      resources: ["DataSets", "AIModels", "Analytics"],
    },
  ];

  for (const { roleName, resources } of predefinedRoles) {
    const existingRole = await RoleModel.findOne({ roleName });

    if (!existingRole) {
      const permissions = await PermissionModel.find({
        resource: { $in: resources },
        action: { $in: Object.values(PermissionActions) },
      });

      const newRole = new RoleModel({
        roleName,
        permissions: permissions.map((permission) => permission._id),
      });

      await newRole.save();
      console.log(`Role ${roleName} initialized with permissions.`);
    } else {
      console.log(`Role ${roleName} already exists.`);
    }
  }
}

// Exporting functions
export {
  createRole,
  getAllRoles,
  getRoleByName,
  getRoleById,
  updateRoleById,
  addPermissionToRole,
  removePermissionFromRole,
  deleteRoleById,
  initializeRolesWithPermissions,
};
