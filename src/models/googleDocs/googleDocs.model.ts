// Google Docs functionalities
import { docs } from "../../clients/google.client";
import logger from "../../utils/logger";
import { ExternalServiceError } from "../../utils/errors";

const fetchDocumentContent = async (documentId: string) => {
  try {
    const response = await docs.documents.get({
      documentId: documentId,
    });
    const document: any = response.data;
    logger.info({
      message: `Fetched document content`,
      documentId,
      title: document.title,
    });
    document.body.content.forEach((element: any) => {
      if (element.paragraph) {
        element.paragraph.elements.forEach((elem: any) => {
          if (elem.textRun) {
            // Optionally log or process textRun content here
          }
        });
      }
    });
  } catch (error) {
    logger.error({ message: `Error fetching document ${documentId}`, error });
    throw new ExternalServiceError(`Error fetching document ${documentId}`);
  }
};

export { fetchDocumentContent };
