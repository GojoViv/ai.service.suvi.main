import { Router } from "express";
import { httpChat } from "./chat.controller";

const chatRouter = Router();

chatRouter.post("/", httpChat);

export { chatRouter };
