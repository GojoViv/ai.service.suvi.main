import { Request, Response } from "express";
import { searchDatabase } from "../../models/db/search";
import { chatWithSuvi } from "../../services/chatbot/chatbot.service";
import { generatePrepInsights } from "../../services/docReview/docReview.service";
import logger from "../../utils/logger";
import { ExternalServiceError, asyncHandler } from "../../utils/errors";

export const httpGenerateGmatPrepReview = asyncHandler(
  async (req: Request, res: Response) => {
    const { query } = req.body;

    if (!query) {
      logger.warn("Document review attempt without query");
      throw new ExternalServiceError("Query is required");
    }

    const response = await generatePrepInsights(query);
    logger.info("Document review completed successfully", {
      queryLength: query.length,
    });
    res.status(200).json({ response });
  }
);
