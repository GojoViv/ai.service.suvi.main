import dotenv from "dotenv";

import simpleGit from "simple-git";
import path from "path";

import { generateCodeAnalysisPdf } from "./generateCodeAnalysisPdf";
import fs from "fs/promises";
import Repository from "../../models/repository/repository.schema";
import { analyzeWithOpenAI } from "../../clients/openai.client";
import { extractMetadataFromClonedRepo } from "./generateCodeAnalysisPdf";

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_PAT;

async function processRepositoryMetadata(metadata: any) {
  const processedMetadata: any = {
    totalFiles: 0,
    totalLOC: 0,
    fileTypes: {},
    codeFiles: [],
  };

  for (const item of metadata) {
    if (item.type === "file") {
      const extension = item.name.split(".").pop() || "unknown";
      processedMetadata.totalFiles += 1;
      processedMetadata.fileTypes[extension] =
        (processedMetadata.fileTypes[extension] || 0) + 1;

      // Fetch file content for LOC and analysis
      if (item.download_url) {
        try {
          const response = await fetch(item.download_url);
          if (response.ok) {
            const content = await response.text();
            const loc = content.split("\n").length;

            processedMetadata.totalLOC += loc;

            if (
              ["js", "ts", "py", "java", "cpp", "cs", "dart"].includes(
                extension
              )
            ) {
              processedMetadata.codeFiles.push({
                name: item.name,
                path: item.path,
                extension,
                loc,
                content,
              });
            }
          } else {
            console.error(`Failed to fetch file: ${item.name}`);
          }
        } catch (err) {
          console.error(`Error fetching file content for: ${item.name}`, err);
        }
      }
    }
  }

  return processedMetadata;
}

async function fetchRepositoryMetadataFromApi(repoUrl: string) {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)(\.git)?/);
  if (!match) throw new Error("Invalid GitHub repository URL.");

  const [_, owner, repo] = match;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch repository metadata: ${response.statusText}`
    );
  }

  const data = await response.json();
  return data; // Contains metadata about files and directories
}

export async function getLatestCommitHash(repoPath: string): Promise<string> {
  try {
    const git = simpleGit(repoPath);
    const log = await git.log();
    return log.latest?.hash || "";
  } catch (error) {
    console.error(`Error fetching latest commit hash: ${error}`);
    throw error;
  }
}

export async function fetchLatestCommitHashFromApi(repoUrl: string) {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)(\.git)?/);
  if (!match) throw new Error("Invalid GitHub repository URL.");

  const [_, owner, repo] = match;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch commits: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data || data.length === 0) {
    throw new Error("No commits found in the repository.");
  }

  return data[0].sha;
}

const analyseCodebase = async (metadata: any, codeFiles: any) => {
  const prompt = `
  You are a senior software engineer and code review expert. You have been tasked with performing a detailed and professionally formatted analysis of a codebase to prepare a comprehensive report. Below is the metadata and details of the code files:

  Metadata:
  - Total Files: ${metadata.totalFiles}
  - Total Lines of Code (LOC): ${metadata.totalLOC}
  - File Types: ${Object.entries(metadata.fileTypes)
    .map(([type, count]) => `${type}: ${count} files`)
    .join(", ")}

  Code Files:
  ${codeFiles
    .map(
      (file: any) => `
  File: ${file.name} (${file.extension})
  Lines of Code: ${file.loc}
  Content (Truncated to 500 characters):
  ${file.content.slice(0, 500)}
  `
    )
    .join("\n")}

  Instructions:
  Perform a detailed analysis of the codebase. Your response must be well-written and formatted like a formal report, with no use of symbols such as **, --, or similar. Use numbered and bulleted lists where appropriate. Each section should be clearly titled and follow this structure:

  1. Code Quality:
     - Evaluate readability, naming conventions, modularity, and maintainability.
     - Provide specific examples for duplicate code, dead code, or overly complex logic, and suggest improvements.

  2. Adherence to Best Practices:
     - Highlight deviations from standard coding practices specific to each language.
     - Provide suggestions for modernizing the code with appropriate examples.

  3. Code Architecture:
     - Assess scalability, reusability, and separation of concerns.
     - Identify areas with tight coupling or lack of modularity and recommend changes.

  4. Security:
     - Identify vulnerabilities such as missing input validation, hardcoded secrets, or insecure dependency usage.
     - Provide specific examples and mitigation strategies.

  5. Performance Optimization:
     - Highlight inefficiencies in code and suggest performance improvements with concrete examples.

  6. Testing and Documentation:
     - Review the presence and quality of unit tests, integration tests, and inline comments.
     - Suggest areas where testing is inadequate or documentation is incomplete.

  Deliverables:
  - A structured, professional report with clearly titled sections.
  - Each issue should include a concise explanation and a detailed recommendation for improvement.
  `;

  const feedback = await analyzeWithOpenAI(prompt);
  return feedback;
};

async function analyseRepository(repoUrl: string) {
  const LOCAL_PATH = path.resolve(__dirname, "code");
  let pdfPath: string | undefined;

  try {
    if (!GITHUB_TOKEN) {
      throw new Error(
        "GITHUB_TOKEN is not set. Please set it in your environment variables."
      );
    }
    if (!repoUrl || !/^https:\/\/github\.com\/.+/.test(repoUrl)) {
      throw new Error("Github URL is not valid.");
    }

    const authRepoUrl = repoUrl.replace(
      /^https:\/\/(github\.com)/i,
      `https://${GITHUB_TOKEN}@$1`
    );

    const existingRepo = await Repository.findOne({ repoUrl });

    if (existingRepo) {
      console.log("Found existing analysis for this repository.");

      const latestCommitHash = await fetchLatestCommitHashFromApi(repoUrl);

      if (
        existingRepo.lastCommitHash === latestCommitHash &&
        existingRepo.analysis
      ) {
        console.log(
          "Repository has not been updated. Returning existing analysis."
        );
        const metadata = {
          totalFiles: existingRepo.metadata.totalFiles || 0,
          totalLOC: existingRepo.metadata.totalLOC || 0,
          fileTypes: existingRepo.metadata.fileTypes || {},
          codeFiles: existingRepo.metadata.codeFiles || [],
        };
        pdfPath = await generateCodeAnalysisPdf(
          metadata,
          existingRepo.analysis
        );
        if (!pdfPath) {
          throw new Error("PDF generation failed for existing analysis.");
        }
        return pdfPath;
      }

      console.log("Repository has been updated. Re-analyzing...");
    }

    const git = simpleGit();
    await git.clone(authRepoUrl, LOCAL_PATH);

    const metadataClonedRepo = await extractMetadataFromClonedRepo(LOCAL_PATH);

    const analysis = await analyseCodebase(
      metadataClonedRepo,
      metadataClonedRepo.codeFiles
    );
    if (!analysis) {
      throw new Error("Code analysis failed.");
    }

    await Repository.updateOne(
      { repoUrl },
      {
        $set: {
          repoUrl,
          analysis,
          metadata: metadataClonedRepo,
          lastAnalysisDate: new Date(),
          lastCommitHash: await getLatestCommitHash(LOCAL_PATH),
        },
      },
      { upsert: true }
    );

    pdfPath = await generateCodeAnalysisPdf(metadataClonedRepo, analysis ?? "");
    return pdfPath;
  } catch (error: any) {
    console.error("Error cloning repository:", error);
    throw error;
  } finally {
    try {
      console.log(`Cleaning up repository at: ${LOCAL_PATH}`);
      await fs.rm(LOCAL_PATH, { recursive: true, force: true });
      console.log("Cleanup successful.");
    } catch (cleanupError) {
      console.error(`Error during cleanup of ${LOCAL_PATH}:`, cleanupError);
    }
  }
}

export { fetchRepositoryMetadataFromApi, analyseCodebase, analyseRepository };
