import { Router } from "express";
import {
  httpCreatePermission,
  httpGetAllPermissions,
  httpGetPermissionById,
  httpGetPermissionsByResource,
  httpUpdatePermissionById,
  httpDeletePermissionById,
} from "./permission.controller"; // Adjust the import path as necessary

const permissionRouter = Router();

// Route to create a new permission
permissionRouter.post("/", httpCreatePermission);

// Route to get all permissions
permissionRouter.get("/", httpGetAllPermissions);

// Route to get a permission by ID
permissionRouter.get("/:id", httpGetPermissionById);

// Route to get permissions by resource
permissionRouter.get("/resource", httpGetPermissionsByResource);

// Route to update a permission by ID
permissionRouter.put("/:id", httpUpdatePermissionById);

// Route to delete a permission by ID
permissionRouter.delete("/:id", httpDeletePermissionById);

export { permissionRouter };
