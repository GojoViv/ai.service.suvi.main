import { Octokit } from "octokit";
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from "../config/environment";
import logger from "../utils/logger";
import { ExternalServiceError } from "../utils/errors";

// Type definitions
interface GitHubOptions {
  owner: string;
  repo: string;
  path?: string;
  ref?: string;
}

interface CreatePROptions extends GitHubOptions {
  title: string;
  body: string;
  head: string;
  base: string;
}

// Validate required environment variables
if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  throw new Error(
    "Missing GitHub credentials. Please check your environment variables."
  );
}

// Initialize GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: "Suvi Bot",
  timeZone: "UTC",
  baseUrl: "https://api.github.com",
  log: {
    debug: () => {},
    info: () => {},
    warn: console.warn,
    error: console.error,
  },
});

/**
 * Gets the contents of a file or directory in a repository
 * @param {GitHubOptions} options Repository and path options
 * @returns {Promise<any>} The contents of the file or directory
 */
async function getContents(options: GitHubOptions) {
  try {
    const { owner, repo, path = "", ref } = options;

    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo,
        path,
        ref,
      }
    );

    logger.info({
      message: "GitHub contents retrieved successfully",
      owner,
      repo,
      path,
    });
    return response.data;
  } catch (error) {
    logger.error({ message: "Error getting GitHub contents", error });
    throw new ExternalServiceError("Failed to get GitHub contents");
  }
}

/**
 * Creates a pull request
 * @param {CreatePROptions} options Pull request options
 * @returns {Promise<any>} The created pull request
 */
async function createPullRequest(options: CreatePROptions) {
  try {
    const { owner, repo, title, body, head, base } = options;

    const response = await octokit.request("POST /repos/{owner}/{repo}/pulls", {
      owner,
      repo,
      title,
      body,
      head,
      base,
    });

    logger.info({
      message: "Pull request created successfully",
      owner,
      repo,
      title,
    });
    return response.data;
  } catch (error) {
    logger.error({ message: "Error creating pull request", error });
    throw new ExternalServiceError("Failed to create pull request");
  }
}

export { octokit, getContents, createPullRequest };
