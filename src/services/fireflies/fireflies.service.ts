import axios, { AxiosError } from "axios";
import { Meeting } from "../../models/meeting/meeting.schema";
import { Project } from "../../models/project/project.schema";
import { FIREFLIES_API_KEY } from "../../config/environment";
import { createPage } from "../../models/notion/notion.model";
import mongoose from "mongoose";
import logger from "../../utils/logger";
import { ExternalServiceError, ValidationError } from "../../utils/errors";

const API_KEY = FIREFLIES_API_KEY ?? "";
const API_KEYS = FIREFLIES_API_KEY?.split(",") ?? [];
const BASE_URL = "https://api.fireflies.ai/graphql";
const GENERAL_MEETING_DATABASE = "[NOTION_DATABASE_ID]";

async function createAxiosClient(apiKey: string) {
  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  return client;
}

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
});

export async function getMeetingsList(
  startDate: Date,
  endDate: Date,
  client: any
) {
  console.info(
    `[Fireflies] Fetching meetings from ${startDate.toISOString()} to ${endDate.toISOString()}`
  );

  if (startDate >= endDate) {
    const error = "Start date must be before end date";
    console.error(`[Fireflies] ${error}`);
    throw new Error(error);
  }

  const query = `
    query Transcripts($fromDate: DateTime!, $toDate: DateTime!) {
      transcripts(fromDate: $fromDate, toDate: $toDate) {
        id
        title
        date
        duration
        transcript_url
        meeting_attendees {
          name
          email
        }
      }
    }
  `;

  const variables = {
    fromDate: startDate.toISOString(),
    toDate: endDate.toISOString(),
  };

  try {
    console.debug(`[Fireflies] Sending GraphQL query:`, query);

    const response = await client.post("", { query, variables });

    if (response.data.errors) {
      console.error(
        `[Fireflies] GraphQL errors:`,
        JSON.stringify(response.data.errors, null, 2)
      );
      throw new Error(
        response.data.errors[0]?.message || "GraphQL error occurred"
      );
    }

    const meetings = response.data.data?.transcripts;
    if (!meetings) {
      console.error(
        `[Fireflies] Unexpected response structure:`,
        JSON.stringify(response.data, null, 2)
      );
      throw new Error("Invalid response structure");
    }

    console.info(
      `[Fireflies] Successfully fetched ${meetings.length} meetings`
    );
    return meetings;
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error(`[Fireflies] API request failed:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: JSON.stringify(error.response?.data, null, 2),
        message: error.message,
      });

      if (error.response?.data?.errors) {
        const apiError = error.response.data.errors[0];
        throw new Error(`Fireflies API Error: ${apiError.message}`);
      }
    }
    throw error;
  }
}

export async function getMeetingDetails(transcriptId: string, client: any) {
  if (!transcriptId) {
    throw new Error("Transcript ID is required");
  }

  console.info(
    `[Fireflies] Fetching details for transcript ID: ${transcriptId}`
  );

  const query = `
    query Transcript($transcriptId: String!) {
      transcript(id: $transcriptId) {
        id
        title
        date
        duration
        summary {
          overview
          action_items       # Changed this - it's just a string
          topics_discussed
        }
        sentences {
          text
          speaker_name
          start_time
          end_time
        }
        meeting_attendees {
          name
          email
        }
      }
    }
  `;

  const variables = {
    transcriptId,
  };

  try {
    const response = await client.post("", { query, variables });

    if (response.data.errors) {
      console.error(
        `[Fireflies] GraphQL errors:`,
        JSON.stringify(response.data.errors, null, 2)
      );
      throw new Error(
        response.data.errors[0]?.message || "GraphQL error occurred"
      );
    }

    const transcript = response.data.data?.transcript;
    if (!transcript) {
      console.error(`[Fireflies] No transcript found for ID: ${transcriptId}`);
      throw new Error("Transcript not found");
    }

    console.info(
      `[Fireflies] Successfully fetched details for transcript ID: ${transcriptId}`
    );
    return transcript;
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error(`[Fireflies] API request failed:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: JSON.stringify(error.response?.data, null, 2),
        message: error.message,
      });
    }
    throw error;
  }
}

export async function extractProjectIds(
  title: string
): Promise<mongoose.Types.ObjectId[]> {
  console.info(`[Fireflies] Extracting project IDs from title: "${title}"`);
  try {
    // Early return if title is empty
    if (!title) {
      console.warn("[Fireflies] Empty title provided");
      return [];
    }

    // Convert title to lowercase for case-insensitive matching
    const titleLower = title.toLowerCase();

    // Find all projects in the database
    const projects = await Project.find({});

    // Match any project whose name (case-insensitive) appears in the title
    const matchingProjects = projects.filter((project) =>
      titleLower.includes(project.name.toLowerCase())
    );

    if (matchingProjects.length === 0) {
      console.warn(
        `[Fireflies] No matching projects found in title: "${title}"`
      );
      return [];
    }

    console.info(
      `[Fireflies] Found ${matchingProjects.length} matching project(s) in title: "${title}"`
    );

    // Return the IDs of matching projects
    const projectIds = matchingProjects.map((project) => project._id);
    return projectIds;
  } catch (error) {
    console.error(
      "[Fireflies] Error extracting project IDs:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

export async function addMeetingToNotion(meeting: any, databaseId: string) {
  try {
    const participantsFormatted = meeting.participants.map((p: any) => p.email);

    const chunkText = (text: string, size: number = 2000): string[] => {
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += size) {
        chunks.push(text.slice(i, i + size));
      }
      return chunks;
    };

    const properties = {
      Title: {
        title: [{ text: { content: meeting.title } }],
      },
      "Meeting ID": {
        rich_text: [{ text: { content: meeting.firefliesMeetingId } }],
      },
      "Date & Time": {
        date: {
          start: meeting.startTime.toISOString(),
          time_zone: "UTC",
        },
      },
      "Duration(Minutes)": {
        rich_text: [{ text: { content: meeting.duration.toString() } }],
      },
      Participants: {
        multi_select: participantsFormatted.map((p: any) => ({ name: p })),
      },
      Summary: {
        rich_text: [{ text: { content: meeting.summary } }],
      },
    };

    const children = [
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: "Topics Discussed" } }],
        },
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ text: { content: meeting.topics.join("\n• ") } }],
        },
      },
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: "Action Items" } }],
        },
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              text: {
                content: meeting.actionItems
                  .map((item: any) => `• ${item.text} [${item.assignee}]`)
                  .join("\n"),
              },
            },
          ],
        },
      },
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: "Transcript" } }],
        },
      },
    ];

    const transcriptChunks = chunkText(meeting.transcript);
    transcriptChunks.forEach((chunk) => {
      children.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ text: { content: chunk } }],
        },
      });
    });

    const response = await createPage(
      { database_id: databaseId },
      properties,
      children
    );

    console.info(`[Notion] Created meeting page: ${response.id}`);
    return response;
  } catch (error) {
    console.error("[Notion] Failed to add meeting:", error);
    throw error;
  }
}

export async function storeMeeting(meetingData: any, meetingDetails: any) {
  try {
    const existingMeeting = await Meeting.findOne({
      firefliesMeetingId: meetingData.id,
    });

    if (existingMeeting) {
      console.info(`[Fireflies] Meeting ${meetingData.id} already exists`);
      return null;
    }

    const projectIds = await extractProjectIds(meetingData.title);
    console.info(
      `[Fireflies] Found ${projectIds.length} project(s) for meeting ${meetingData.id}`
    );

    const meeting = await saveMeetingToMongo(
      meetingData,
      meetingDetails,
      projectIds
    );
    console.info(`[Fireflies] Saved meeting to MongoDB: ${meeting._id}`);

    // Add to Notion
    if (projectIds.length > 0) {
      const projects = await Project.find({ _id: { $in: projectIds } });
      const projectsWithNotion = projects.filter((p) => p.meetingsDatabaseId);

      if (projectsWithNotion.length > 0) {
        for (const project of projectsWithNotion) {
          try {
            console.info(
              `[Notion] Adding meeting to project database: ${project.meetingsDatabaseId}`
            );
            await addMeetingToNotion(meeting, project.meetingsDatabaseId ?? "");
            console.info(
              `[Notion] Successfully added meeting to project ${project._id}`
            );
          } catch (error) {
            console.error(
              `[Notion] Failed to add meeting to project ${project._id}:`,
              error
            );
          }
        }
      } else {
        console.info(
          "[Notion] No project databases found, adding to general database"
        );
        await addMeetingToNotion(meeting, GENERAL_MEETING_DATABASE);
      }
    } else {
      console.info("[Notion] No matching projects, adding to general database");
      await addMeetingToNotion(meeting, GENERAL_MEETING_DATABASE);
    }

    return meeting;
  } catch (error) {
    console.error(
      `[Fireflies] Error storing meeting ${meetingData.id}:`,
      error
    );
    throw error;
  }
}

const parseActionItems = (actionItemsStr: string) => {
  const items: { text: string; assignee?: string }[] = [];
  if (!actionItemsStr) return items;

  const sections = actionItemsStr.split("**").filter(Boolean);

  for (let i = 1; i < sections.length; i += 2) {
    const assignee = sections[i].trim();
    if (i + 1 >= sections.length) continue;

    const tasks = sections[i + 1]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("**"))
      .map((task) => {
        // Remove time stamps like (00:44)
        const taskText = task.replace(/\(\d{2}:\d{2}\)$/, "").trim();
        return {
          assignee: assignee, // Swapped: assignee field gets the assignee
          text: taskText, // Swapped: text field gets the task text
        };
      });

    items.push(...tasks);
  }

  return items;
};

const extractTopics = (overview: string) => {
  if (!overview) return [];

  // Split overview into sentences
  const sentences = overview.split(". ");

  // Look for key phrases that indicate topics
  const topics = sentences
    .filter(
      (sentence) =>
        sentence.includes("discussed") ||
        sentence.includes("working on") ||
        sentence.includes("focused on") ||
        sentence.includes("progress on")
    )
    .map((sentence) => {
      // Extract key phrases
      return sentence
        .replace(/^.*?(discussed|working on|focused on|progress on)\s+/i, "")
        .replace(/\.$/, "")
        .trim();
    });

  return topics;
};
async function saveMeetingToMongo(
  meetingData: any,
  meetingDetails: any,
  projectIds: any[]
) {
  const actionItems = parseActionItems(
    meetingDetails.summary?.action_items || ""
  );
  const topics = extractTopics(meetingDetails.summary?.overview || "");

  const meeting = new Meeting({
    firefliesMeetingId: meetingData.id,
    transcriptId: meetingData.transcript_url,
    title: meetingData.title,
    startTime: new Date(meetingData.date),
    endTime: new Date(
      new Date(meetingData.date).getTime() + meetingData.duration * 60000
    ),
    duration: meetingData.duration,
    participants: (meetingData.meeting_attendees || []).map((p: any) => ({
      email: p.email,
      name: p.name,
      isHost: false,
    })),
    transcript: meetingDetails.sentences
      ? meetingDetails.sentences.map((s: any) => s.text).join("\n")
      : "",
    summary: meetingDetails.summary?.overview || "",
    topics,
    actionItems,
    source: "fireflies",
    projectIds,
    lastSyncedAt: new Date(),
  });

  await meeting.save();

  if (projectIds.length > 0) {
    await Project.updateMany(
      { _id: { $in: projectIds } },
      { $addToSet: { meetings: meeting._id } }
    );
  }

  return meeting;
}

export const syncMeetings = async (
  startDate: Date,
  endDate: Date
): Promise<any> => {
  try {
    logger.info("Starting Fireflies meeting sync", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    if (!startDate || !endDate) {
      logger.warn("Invalid date range for meeting sync");
      throw new ValidationError("Start date and end date are required", []);
    }

    return "";
  } catch (error) {
    logger.error("Failed to sync Fireflies meetings", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new ExternalServiceError("Failed to sync Fireflies meetings");
  }
};

export const handleFirefliesError = async (error: Error): Promise<any> => {
  logger.error("Fireflies sync error occurred", {
    error: error.message,
    stack: error.stack,
  });

  return {
    status: "error",
    message: "An error occurred while syncing meetings",
    details: error.message,
  };
};
