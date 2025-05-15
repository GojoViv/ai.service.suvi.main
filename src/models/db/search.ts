import mongoose from "mongoose";
import logger from "../../utils/logger";
import { ExternalServiceError } from "../../utils/errors";

interface SearchResult {
  collection: string;
  document: any;
}

export async function searchDatabase(
  keyword: string,
  topK: number
): Promise<SearchResult[]> {
  const collections = [
    "projects",
    "notiontasks",
    "channels",
    "clients",
    "employees",
    "kanbanprojects",
    "slackmessages",
    "telegrammessages",
  ];
  try {
    const searchPromises = collections.map(async (collectionName) => {
      const collection = mongoose.connection.collection(collectionName);
      const docs = await collection
        .find({ $text: { $search: keyword } })
        .limit(topK)
        .toArray();

      logger.info({
        message: `Searched collection ${collectionName}`,
        count: docs.length,
      });
      return docs.map((doc) => ({ collection: collectionName, document: doc }));
    });

    const results = await Promise.all(searchPromises);
    logger.info({
      message: "Database search completed",
      totalResults: results.flat().length,
    });
    return results.flat();
  } catch (error) {
    logger.error({ message: "Error searching database", error });
    throw new ExternalServiceError("Error searching database");
  }
}
