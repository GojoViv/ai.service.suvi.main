import { Router } from "express";
import { httpQAFrontend } from "./qa.controller";

const qaRouter = Router();

qaRouter.post("/", httpQAFrontend);

export default qaRouter;
