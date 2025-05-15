import { Router } from "express";

import { httpGenerateGmatPrepReview } from "./docReview.controller";

const docReviewRouter = Router();

docReviewRouter.post("/review", httpGenerateGmatPrepReview);

export { docReviewRouter };
