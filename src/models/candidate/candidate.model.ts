import CandidateModel from "./candidate.schema";
import { ICandidate } from "../../types/ICandidate";
import logger from "../../utils/logger";
import { ExternalServiceError } from "../../utils/errors";

export const createCandidate = async (
  candidate: Partial<ICandidate>
): Promise<ICandidate | null> => {
  try {
    const newCandidate = await CandidateModel.create(candidate);
    logger.info({ message: "Candidate created", candidate: newCandidate });
    return newCandidate;
  } catch (error) {
    logger.error({ message: "Error creating candidate", error });
    throw new ExternalServiceError("Error creating candidate");
  }
};

export const getAllCandidates = async (): Promise<ICandidate[] | null> => {
  try {
    const candidates = await CandidateModel.find({}, { _id: 0, __v: 0 });
    logger.info({
      message: "Retrieved all candidates",
      count: candidates.length,
    });
    return candidates;
  } catch (error) {
    logger.error({ message: "Error retrieving candidates", error });
    throw new ExternalServiceError("Error retrieving candidates");
  }
};
