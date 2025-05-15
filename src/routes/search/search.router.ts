import { Router } from "express";
import { httpSearch } from "./search.controller";

const searchRouter = Router();

searchRouter.get("/", httpSearch);

export { searchRouter };
