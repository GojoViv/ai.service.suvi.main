import { Router } from "express";
import {
  httpCreateRole,
  httpGetAllRoles,
  httpGetRoleByName,
  httpGetRoleById,
  httpUpdateRoleById,
  httpAddPermissionToRole,
  httpRemovePermissionFromRole,
  httpDeleteRoleById,
} from "./role.controller"; // Adjust the import path as necessary

const roleRouter = Router();

// Routes for role management
roleRouter.post("/", httpCreateRole);
roleRouter.get("/", httpGetAllRoles);
roleRouter.get("/name/:roleName", httpGetRoleByName); // Assuming roles have unique names
roleRouter.get("/:id", httpGetRoleById);
roleRouter.put("/:id", httpUpdateRoleById);
roleRouter.post("/:roleId/permissions", httpAddPermissionToRole); // Adding a permission to a role
roleRouter.delete(
  "/:roleId/permissions/:permissionId",
  httpRemovePermissionFromRole
); // Removing a permission from a role
roleRouter.delete("/:id", httpDeleteRoleById);

export { roleRouter };
