import { Router } from "express";
import {
  httpCreateClient,
  httpGetAllClients,
  httpGetClientById,
  httpUpdateClientById,
  httpDeleteClientById,
} from "./client.controller";

const clientRouter = Router();

clientRouter.post("/", httpCreateClient);
clientRouter.get("/", httpGetAllClients);
clientRouter.get("/:id", httpGetClientById);
clientRouter.put("/:id", httpUpdateClientById);
clientRouter.delete("/:id", httpDeleteClientById);

export { clientRouter };
