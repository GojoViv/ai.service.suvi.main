import { Router } from "express";
import {
  httpCreateAssistant,
  httpCreateThread,
  httpGetThreadMessages,
  httpTalkToSuvi,
} from "./assistant.controller";

const assistantRouter = Router();

assistantRouter.post("/talk/:threadId", httpTalkToSuvi);
assistantRouter.post("/talk", httpTalkToSuvi);
assistantRouter.post("/", httpCreateAssistant);
assistantRouter.post("/thread", httpCreateThread);
assistantRouter.get("/thread", httpGetThreadMessages);

export { assistantRouter };
