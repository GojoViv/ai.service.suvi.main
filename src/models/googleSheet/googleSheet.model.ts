import { sheets, drive } from "../../clients/google.client";
import logger from "../../utils/logger";
import { ExternalServiceError } from "../../utils/errors";

const fetchSheetData = async (spreadsheetId: string, range: string) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows: any = response.data.values;
    if (rows.length) {
      logger.info({
        message: "Fetched sheet data",
        spreadsheetId,
        range,
        rowCount: rows.length,
      });
      return rows; // Return the rows
    } else {
      logger.info({ message: "No data found in sheet", spreadsheetId, range });
      return []; // Return an empty array if no data found
    }
  } catch (error) {
    logger.error({
      message: "Error fetching data from Google Sheets",
      spreadsheetId,
      range,
      error,
    });
    return []; // Return an empty array in case of error
  }
};

const createNewSpreadsheet = async (config: any) => {
  try {
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: config.title,
        },
        sheets: config.sheetsToCreate.map((sheet: any) => ({
          properties: {
            title: sheet.name,
          },
        })),
      },
    });

    const spreadsheetId = createResponse.data.spreadsheetId;

    if (!spreadsheetId) {
      logger.error({
        message: "Failed to create spreadsheet: No spreadsheetId returned",
      });
      throw new ExternalServiceError(
        "Failed to create spreadsheet: No spreadsheetId returned"
      );
    }

    // Make the spreadsheet publicly accessible
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    for (const sheet of config.sheetsToCreate) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: `${sheet.name}!A1`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: sheet.data,
        },
      });
    }

    logger.info({
      message: "Spreadsheet created and made public",
      spreadsheetId,
      spreadsheetUrl: createResponse.data.spreadsheetUrl,
    });
    return {
      spreadsheetId,
      spreadsheetUrl: createResponse.data.spreadsheetUrl,
    };
  } catch (error) {
    logger.error({ message: "Error creating spreadsheet", error });
    throw new ExternalServiceError("Error creating spreadsheet");
  }
};

export { fetchSheetData, createNewSpreadsheet };
