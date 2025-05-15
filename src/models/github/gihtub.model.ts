import GitHubOrg from "./github.schema";
import logger from "../../utils/logger";
import { ExternalServiceError } from "../../utils/errors";

export const saveOrgDetails = async (
  orgId: string,
  orgName: string,
  installationId: string
) => {
  try {
    const org = new GitHubOrg({
      orgId,
      orgName,
      installationId,
    });
    await org.save();
    logger.info({
      message: "GitHub org details saved",
      orgId,
      orgName,
      installationId,
    });
  } catch (error) {
    logger.error({
      message: "Error saving GitHub org details",
      orgId,
      orgName,
      installationId,
      error,
    });
    throw new ExternalServiceError("Error saving GitHub org details");
  }
};
