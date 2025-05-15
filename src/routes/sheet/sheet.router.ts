import { Router } from "express";

import { httpsCreateSheet } from "./sheet.controller";

const sheetRouter = Router();

sheetRouter.post("/create", httpsCreateSheet);

export { sheetRouter };
