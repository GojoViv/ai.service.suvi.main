import { Request, Response } from "express";
import { QAWebsite } from "../../services/qa/qa.service";
import logger from "../../utils/logger";
import {
  ValidationError,
  ExternalServiceError,
  asyncHandler,
} from "../../utils/errors";

export const httpQAFrontend = asyncHandler(
  async (req: Request, res: Response) => {
    const { url } = req.body;

    if (!url) {
      logger.warn("Missing URL in QA request");
      throw new ValidationError("URL is required", []);
    }

    const response = await QAWebsite(url);
    logger.info("QA analysis completed successfully", { url });

    return res.status(200).json({ response });
  }
);
