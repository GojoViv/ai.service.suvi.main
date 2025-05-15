import { Request, Response } from "express";
import { createNewSpreadsheet } from "../../models/googleSheet/googleSheet.model";
import logger from "../../utils/logger";
import {
  ValidationError,
  ExternalServiceError,
  asyncHandler,
} from "../../utils/errors";

const httpsCreateSheet = asyncHandler(async (req: Request, res: Response) => {
  const sheetConfig = req.body;

  // Validate request body
  if (!sheetConfig.title || !Array.isArray(sheetConfig.sheetsToCreate)) {
    logger.warn("Invalid sheet creation request", {
      hasTitle: !!sheetConfig.title,
      hasSheetsArray: Array.isArray(sheetConfig.sheetsToCreate),
    });
    throw new ValidationError(
      "Invalid request body. Required: title and sheetsToCreate array",
      []
    );
  }

  // Create the spreadsheet
  const result = await createNewSpreadsheet(sheetConfig);

  logger.info("Spreadsheet created successfully", {
    spreadsheetId: result.spreadsheetId,
    title: sheetConfig.title,
  });

  // Return success response
  return res.status(201).json({
    success: true,
    data: {
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.spreadsheetUrl,
    },
  });
});

export { httpsCreateSheet };
