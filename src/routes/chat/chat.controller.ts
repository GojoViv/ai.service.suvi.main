import { Request, Response } from "express";
import { searchDatabase } from "../../models/db/search";
import { chatWithSuvi } from "../../services/chatbot/chatbot.service";
import logger from "../../utils/logger";
import { ExternalServiceError, asyncHandler } from "../../utils/errors";

export const httpChat = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.body;

  if (!query) {
    logger.warn("Chat attempt without query");
    throw new ExternalServiceError("Query is required");
  }

  const results = await searchDatabase(query, 10);
  const response = await chatWithSuvi(query, results);

  logger.info("Chat completed successfully", { queryLength: query.length });
  res.status(200).json({ response });
});
