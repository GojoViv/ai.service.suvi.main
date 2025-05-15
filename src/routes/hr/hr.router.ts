import { Router } from "express";
import {
  httprecommendCandidatesProfile,
  httpGetLeaveStats,
  httpGetLeaveSummary,
  httpGetLeavesByEmail,
} from "./hr.controller";

const hrRouter = Router();

hrRouter.post("/recommend", httprecommendCandidatesProfile);
hrRouter.get("/leave/email", httpGetLeavesByEmail);
hrRouter.get("/leave/summary", httpGetLeaveSummary);
hrRouter.get("/leave/stats", httpGetLeaveStats);

export { hrRouter };
