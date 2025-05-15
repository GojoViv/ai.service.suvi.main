import { Request, Response } from "express";
import { searchDatabase } from "../../models/db/search";
import { analyseSearch } from "../../services/search/search.service";
import logger from "../../utils/logger";
import {
  ValidationError,
  ExternalServiceError,
  asyncHandler,
} from "../../utils/errors";

export const httpSearch = asyncHandler(async (req: Request, res: Response) => {
  const { s, k } = req.query;

  if (!s) {
    logger.warn("Missing search query parameter");
    throw new ValidationError("Search query is required", []);
  }

  const searchQuery = s as string;
  const limit = Number(k ?? 5);

  const results = await searchDatabase(searchQuery, limit);
  const items = await analyseSearch(searchQuery, limit, results);

  logger.info("Search completed successfully", {
    query: searchQuery,
    limit,
    resultCount: items.length,
  });

  return res.status(200).json({ items });
});
