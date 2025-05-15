import { WebClient } from "@slack/web-api";
import { openai } from "../../clients";
import { createPage } from "../../models/notion/notion.model";

import { SlackMessage, ISlackMessage } from "../../models/slack/slack.schema";

import ChannelModel from "../../models/channel/channel.schema";
import { createOrUpdateChannel } from "../../models/channel/channel.model";
import { Task } from "../../models/task/task.schema";
import { Sprint } from "../../models/sprint/sprint.schema";
import { Epic } from "../../models/epic/epic.schema";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { Boards } from "../../constants/boards";
import { answerChannelQuery } from "../chatbot/chatbot.service";
import { createEvent, sendEmail } from "../../clients/google.client";

const fetchNewMessagesFromChannel = async (
  slackClient: WebClient,
  channel_id: string,
  latest: string
): Promise<ISlackMessage[]> => {
  try {
    let allMessages: ISlackMessage[] = [];
    let hasMore = true;
    let cursor: string | undefined;

    while (hasMore) {
      const result = await slackClient.conversations.history({
        channel: channel_id,
        cursor: cursor,
        oldest: latest,
        limit: 100,
        inclusive: true,
      });

      const messages = result.messages as ISlackMessage[];
      messages.forEach((message) => {
        message.channel_id = channel_id;
        message.tagged_users = (message.text.match(/<@(\w+)>/g) || []).map(
          (tag) => tag.slice(2, -1)
        );
      });

      allMessages = allMessages.concat(messages);
      cursor = result.response_metadata?.next_cursor;
      hasMore = !!cursor;
    }

    return allMessages;
  } catch (error) {
    throw error;
  }
};

const storeMessagesInMongoDB = async (
  botId: string,
  messages: ISlackMessage[]
): Promise<void> => {
  try {
    const updatePromises = messages.map(async (message) => {
      if (!message.channel_id) {
        // console.error("Message missing channel_id");
        return Promise.resolve(); // Skip messages without channel_id
      }

      return SlackMessage.findOneAndUpdate(
        { ts: message.ts },
        { $set: message },
        { upsert: true, new: true }
      );
    });

    await Promise.all(updatePromises);
  } catch (error) {
    throw error;
  }
};

type Channel = {
  id: string;
  name: string;
  platform: "slack";
  status: "active" | "left";
  lastFetchedTs?: string;
};

const fetchAndStoreMessages = async (
  slackClient: WebClient,
  botId: string,
  channel: Channel
): Promise<void> => {
  try {
    const channelFetchInfo = await ChannelModel.findOne({ id: channel.id });
    const lastFetchedTimestamp = channelFetchInfo
      ? channelFetchInfo.lastFetchedTs
      : "0";

    console.log("Fetching and storing messages from Slack channel...");

    const messages = await fetchNewMessagesFromChannel(
      slackClient,
      channel.id,
      lastFetchedTimestamp
    );

    if (messages.length > 0) {
      await storeMessagesInMongoDB(botId, messages);
      const newLastFetchedTimestamp = messages[0].ts;

      await createOrUpdateChannel({
        ...channel,
        lastFetchedTs: newLastFetchedTimestamp,
      });
    }

    console.log(`Successfully stored ${messages.length} messages in MongoDB.`);
  } catch (error) {
    console.error("Error fetching and storing Slack messages:", error);
    throw error;
  }
};

export async function getTasksByStatus(): Promise<
  { status: string; count: number }[]
> {
  try {
    const tasksByStatus = await Task.aggregate([
      { $group: { _id: "$status.name", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } },
    ]);
    return tasksByStatus;
  } catch (error) {
    throw new Error(`Error fetching tasks by status`);
  }
}

export async function getTasksByAssignee(): Promise<
  { assignee: string; count: number }[]
> {
  try {
    const tasksByAssignee = await Task.aggregate([
      { $group: { _id: "$assignee.name", count: { $sum: 1 } } },
      { $project: { assignee: "$_id", count: 1, _id: 0 } },
    ]);
    return tasksByAssignee;
  } catch (error) {
    throw new Error(`Error fetching tasks by assignee`);
  }
}

export async function getTasksByPriority(): Promise<
  { priority: string; count: number }[]
> {
  try {
    const tasksByPriority = await Task.aggregate([
      { $group: { _id: "$priority.name", count: { $sum: 1 } } },
      { $project: { priority: "$_id", count: 1, _id: 0 } },
    ]);
    return tasksByPriority;
  } catch (error) {
    throw new Error(`Error fetching tasks by priority`);
  }
}

export async function getSprintsByTotalTasks(): Promise<
  { sprintName: string; totalTasks: number }[]
> {
  try {
    const sprintsByTotalTasks = await Sprint.aggregate([
      { $group: { _id: "$sprintName", totalTasks: { $sum: "$totalTasks" } } },
      { $project: { sprintName: "$_id", totalTasks: 1, _id: 0 } },
    ]);
    return sprintsByTotalTasks;
  } catch (error) {
    throw new Error(`Error fetching sprints by total tasks`);
  }
}

export async function getProjectsByOwner(): Promise<
  { owner: string; count: number }[]
> {
  try {
    const projectsByOwner = await Epic.aggregate([
      { $group: { _id: "$owner.name", count: { $sum: 1 } } },
      { $project: { owner: "$_id", count: 1, _id: 0 } },
    ]);
    return projectsByOwner;
  } catch (error) {
    throw new Error(`Error fetching projects by owner`);
  }
}

export async function getSprintsByCompletionRate(): Promise<
  { sprintName: string; completionRate: number }[]
> {
  try {
    const sprintsByCompletionRate = await Sprint.aggregate([
      {
        $group: {
          _id: "$sprintName",
          completedCount: {
            $sum: { $cond: [{ $eq: ["$sprintStatus.name", "Done"] }, 1, 0] },
          },
          totalCount: { $sum: 1 },
        },
      },
      {
        $project: {
          sprintName: "$_id",
          completionRate: {
            $cond: [
              { $eq: ["$totalCount", 0] },
              0,
              { $round: [{ $divide: ["$completedCount", "$totalCount"] }, 2] },
            ],
          },
          _id: 0,
        },
      },
    ]);
    return sprintsByCompletionRate;
  } catch (error) {
    throw new Error(`Error fetching sprints by completion rate`);
  }
}

export async function getTasksByProject(): Promise<
  { project: string; count: number }[]
> {
  try {
    const tasksByProject = await Task.aggregate([
      {
        $group: {
          _id: "$project",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "projects", // Assuming your Project collection name is 'projects'
          localField: "_id",
          foreignField: "projectId",
          as: "projectDetails",
        },
      },
      {
        $project: {
          project: { $arrayElemAt: ["$projectDetails.projectName", 0] },
          count: 1,
          _id: 0,
        },
      },
    ]);
    return tasksByProject.map((item: any) => ({
      project: item.project || "Unknown", // Handle cases where projectDetails may not match
      count: item.count,
    }));
  } catch (error) {
    throw new Error(`Error fetching tasks by project`);
  }
}

export async function getTaskCompletionByAssignee(): Promise<
  { assignee: string; completionRate: number }[]
> {
  try {
    const taskCompletionByAssignee = await Task.aggregate([
      {
        $group: {
          _id: "$assignee.name",
          completedCount: {
            $sum: { $cond: [{ $eq: ["$status.name", "Completed"] }, 1, 0] },
          },
          totalCount: { $sum: 1 },
        },
      },
      {
        $project: {
          assignee: "$_id",
          completionRate: {
            $round: [{ $divide: ["$completedCount", "$totalCount"] }, 2],
          },
          _id: 0,
        },
      },
    ]);
    return taskCompletionByAssignee;
  } catch (error) {
    throw new Error(`Error fetching task completion by assignee`);
  }
}

export async function getProjectCompletionBySprint(): Promise<
  { sprint: string; completionRate: number }[]
> {
  try {
    const projectCompletionBySprint = await Epic.aggregate([
      {
        $unwind: "$sprints",
      },
      {
        $group: {
          _id: "$sprints.sprintName",
          completedCount: {
            $sum: {
              $cond: [{ $eq: ["$sprints.sprintStatus.name", "Done"] }, 1, 0],
            },
          },
          totalCount: { $sum: 1 },
        },
      },
      {
        $project: {
          sprint: "$_id",
          completionRate: {
            $round: [{ $divide: ["$completedCount", "$totalCount"] }, 2],
          },
          _id: 0,
        },
      },
    ]);
    return projectCompletionBySprint;
  } catch (error) {
    throw new Error(`Error fetching project completion by sprint`);
  }
}

const getDateRange = (period: "daily" | "weekly" | "monthly") => {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case "daily":
      startDate = startOfDay(now);
      endDate = endOfDay(now);
      break;
    case "weekly":
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
      break;
    case "monthly":
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
  }

  return { startDate, endDate };
};

const userCache: Record<string, string> = {};
const channelCache: Record<string, string> = {};

// Helper function to fetch user details from Slack API or cache
const getUserDetails = async (
  client: WebClient,
  userId: string
): Promise<string> => {
  if (userCache[userId]) {
    return userCache[userId];
  } else {
    try {
      const response = await client.users.info({ user: userId });
      const userName =
        response.user?.real_name || response.user?.name || userId;
      userCache[userId] = userName;
      return userName;
    } catch (error) {
      console.error(`Error fetching user details for user ${userId}`);
      return userId;
    }
  }
};

// Helper function to fetch channel details from Slack API or cache
const getChannelDetails = async (
  client: WebClient,
  channelId: string
): Promise<string> => {
  if (channelCache[channelId]) {
    return channelCache[channelId];
  } else {
    try {
      const response = await client.conversations.info({ channel: channelId });
      const channelName = response.channel?.name || channelId;
      channelCache[channelId] = channelName;
      return channelName;
    } catch (error) {
      console.error(`Error fetching channel details for channel ${channelId}`);
      return channelId;
    }
  }
};

// Function to get overall user message counts grouped by channel and user
export const getOverallUserMessageCounts = async (
  client: WebClient
): Promise<Record<string, Record<string, number>>> => {
  try {
    const result = await SlackMessage.aggregate([
      {
        $group: {
          _id: { user: "$user", channel_id: "$channel_id" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.user",
          channels: {
            $push: { channel: "$_id.channel_id", count: "$count" },
          },
        },
      },
      {
        $project: {
          _id: 0,
          user: "$_id",
          channels: 1,
        },
      },
    ]);

    const formattedResult = await Promise.all(
      result.map(async (item) => {
        const user = await getUserDetails(client, item.user);
        const channels: Record<string, number> = {};
        await Promise.all(
          item.channels.map(async (channel: any) => {
            const channelName = await getChannelDetails(
              client,
              channel.channel
            );
            channels[channelName] = channel.count;
          })
        );
        return { [user]: channels };
      })
    );

    return formattedResult.reduce((acc, item) => {
      const user = Object.keys(item)[0];
      acc[user] = item[user];
      return acc;
    }, {});
  } catch (error) {
    throw new Error(`Error fetching overall user message counts`);
  }
};

// Function to get overall mentions count grouped by channel and user
export const getOverallUserMentionsCounts = async (
  client: WebClient
): Promise<Record<string, Record<string, number>>> => {
  try {
    const result = await SlackMessage.aggregate([
      {
        $match: {
          tagged_users: { $exists: true, $not: { $size: 0 } },
        },
      },
      {
        $unwind: "$tagged_users",
      },
      {
        $group: {
          _id: { user: "$user", channel_id: "$channel_id" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.user",
          channels: {
            $push: { channel: "$_id.channel_id", count: "$count" },
          },
        },
      },
      {
        $project: {
          _id: 0,
          user: "$_id",
          channels: 1,
        },
      },
    ]);

    const formattedResult = await Promise.all(
      result.map(async (item) => {
        const user = await getUserDetails(client, item.user);
        const channels: Record<string, number> = {};
        await Promise.all(
          item.channels.map(async (channel: any) => {
            const channelName = await getChannelDetails(
              client,
              channel.channel
            );
            channels[channelName] = channel.count;
          })
        );
        return { [user]: channels };
      })
    );

    return formattedResult.reduce((acc, item) => {
      const user = Object.keys(item)[0];
      acc[user] = item[user];
      return acc;
    }, {});
  } catch (error) {
    throw new Error(`Error fetching overall user mentions counts`);
  }
};

// Function to get overall reactions given count grouped by channel and user
export const getOverallUserReactionsGivenCounts = async (
  client: WebClient
): Promise<Record<string, Record<string, number>>> => {
  try {
    const result = await SlackMessage.aggregate([
      {
        $match: {
          "reactions.users": { $exists: true, $not: { $size: 0 } },
        },
      },
      {
        $unwind: "$reactions",
      },
      {
        $group: {
          _id: { user: "$user", channel_id: "$channel_id" },
          reactionCount: { $sum: "$reactions.count" },
        },
      },
      {
        $group: {
          _id: "$_id.user",
          channels: {
            $push: { channel: "$_id.channel_id", count: "$reactionCount" },
          },
        },
      },
      {
        $project: {
          _id: 0,
          user: "$_id",
          channels: 1,
        },
      },
    ]);

    const formattedResult = await Promise.all(
      result.map(async (item) => {
        const user = await getUserDetails(client, item.user);
        const channels: Record<string, number> = {};
        await Promise.all(
          item.channels.map(async (channel: any) => {
            const channelName = await getChannelDetails(
              client,
              channel.channel
            );
            channels[channelName] = channel.count;
          })
        );
        return { [user]: channels };
      })
    );

    return formattedResult.reduce((acc, item) => {
      const user = Object.keys(item)[0];
      acc[user] = item[user];
      return acc;
    }, {});
  } catch (error) {
    throw new Error(`Error fetching overall user reactions given counts`);
  }
};

// Function to get overall reactions received count grouped by channel and user
export const getOverallUserReactionsReceivedCounts = async (
  client: WebClient
): Promise<Record<string, Record<string, number>>> => {
  try {
    const result = await SlackMessage.aggregate([
      {
        $match: {
          reactions: { $exists: true, $not: { $size: 0 } },
        },
      },
      {
        $unwind: "$reactions",
      },
      {
        $group: {
          _id: { user: "$user", channel_id: "$channel_id" },
          reactionCount: { $sum: "$reactions.count" },
        },
      },
      {
        $group: {
          _id: "$_id.user",
          channels: {
            $push: { channel: "$_id.channel_id", count: "$reactionCount" },
          },
        },
      },
      {
        $project: {
          _id: 0,
          user: "$_id",
          channels: 1,
        },
      },
    ]);

    const formattedResult = await Promise.all(
      result.map(async (item) => {
        const user = await getUserDetails(client, item.user);
        const channels: Record<string, number> = {};
        await Promise.all(
          item.channels.map(async (channel: any) => {
            const channelName = await getChannelDetails(
              client,
              channel.channel
            );
            channels[channelName] = channel.count;
          })
        );
        return { [user]: channels };
      })
    );

    return formattedResult.reduce((acc, item) => {
      const user = Object.keys(item)[0];
      acc[user] = item[user];
      return acc;
    }, {});
  } catch (error) {
    throw new Error(`Error fetching overall user reactions received counts`);
  }
};

function formatDateToYYYYMMDD(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based, so add 1
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const storeTicket = async (ticket: any) => {
  try {
    if (!ticket) return;

    const properties = {
      "Task name": {
        title: [
          {
            text: {
              content: ticket.taskName ?? "",
            },
          },
        ],
      },
    };

    const children = [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              text: {
                content: ticket.taskDescription ?? "",
              },
            },
          ],
        },
      },
    ];

    const page = await createPage(
      { database_id: Boards.TASKS },
      properties,
      children
    );
  } catch (error) {
    throw error;
  }
};

type QueryType = "ticket" | "mail" | "meet" | "query" | "follow_up";
type Platform = "telegram" | "slack";

export const answerQuery = async (
  query: string,
  type: QueryType,
  channelId: string,
  botId: string,
  ticket?: any,
  email?: any,
  meet?: any,
  platform?: Platform
) => {
  console.log(type);

  switch (type) {
    case "follow_up":
      return query;
    case "ticket":
      await storeTicket(ticket);
      return "Ticket created";
    case "mail":
      await sendEmail({
        from: undefined,
        to: email.to ?? "admin@company.com",
        subject: email.subject ?? "Suvi",
        html: email.html ?? "",
        cc: "",
      });
      return "Email sent";
    case "meet":
      const event = {
        ...meet,
        attendees: meet.attendees.map((attendee: string) => ({
          email: attendee,
        })),
      };
      await createEvent("primary", event);
      return "Scheduled meet";
    case "query":
    default:
      return await answerChannelQuery("slack", channelId ?? "", botId, query);
  }
};

export const respondToUserMessage = async (
  botId: string | undefined,
  message: string,
  channelId: string,
  platform?: Platform
) => {
  try {
    const tools: any = [
      {
        type: "function",
        function: {
          name: "answer_query",
          description: "Answer the user's query based on the type of query",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The user's query",
              },
              type: {
                type: "string",
                description: "The type of user query",
                enum: ["ticket", "mail", "meet", "query"],
              },
              channelId: {
                type: "string",
                description:
                  "The channel id of the channel. This is required if query type is channel.",
              },
              email: {
                type: "object",
                properties: {
                  to: {
                    type: "string",
                    description: "Email address of the recepient",
                  },
                  subject: {
                    type: "string",
                    description: "Subject of the email",
                  },
                  html: {
                    type: "string",
                    description: "Body of the email",
                  },
                },
              },
              meet: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "Description of the google meet",
                  },
                  start: {
                    type: "object",
                    properties: {
                      dateTime: {
                        type: "string",
                        description: "Start date time of the meeting",
                      },
                      timeZone: {
                        type: "string",
                        description:
                          "Time zone of the meeting (standard format), defaults to Asia/Kolkata",
                      },
                    },
                    required: ["dateTime", "timeZone"],
                  },
                  end: {
                    type: "object",
                    properties: {
                      dateTime: {
                        type: "string",
                        description: "End date time of the meeting",
                      },
                      timeZone: {
                        type: "string",
                        description:
                          "Time zone of the meeting (standard format), defaults to IST",
                      },
                    },
                    required: ["dateTime", "timeZone"],
                  },
                  attendees: {
                    type: "array",
                    items: {
                      types: "string",
                      description: "Email of attendee",
                    },
                    description: "List of attendees",
                  },
                },
                required: ["summary, start, end, attendees"],
              },
              ticket: {
                type: "object",
                properties: {
                  taskName: {
                    type: "string",
                    description: "The title of the task",
                  },
                  taskDescription: {
                    type: "string",
                    description: "The description of the task",
                  },
                },
                required: ["taskName, taskDescription"],
              },
            },
            required: ["query", "type"],
          },
        },
      },
    ];

    const messages: any = [
      {
        role: "system",
        content: `
        Based on the user query reply to call a function.
        Rules to follow:
         - Do not rephrase the user's query
         ${channelId && `- If query has channelId send it as is`}
         ${platform && `- If query has platform send it as is`}
        `,
      },
      {
        role: "user",
        content: message,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      tools: tools,
      tool_choice: {
        function: { name: "answer_query" },
        type: "function",
      },
    });
    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    if (toolCalls) {
      const availableFunctions: any = {
        answer_query: answerQuery,
      };

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionToCall = availableFunctions[functionName];
        const functionArgs = JSON.parse(toolCall.function.arguments);

        const functionResponse = functionToCall(
          functionArgs.query,
          functionArgs.type,
          channelId,
          botId,
          functionArgs.ticket,
          functionArgs.email,
          functionArgs.meet,
          functionArgs.platform
        );

        return functionResponse;
      }
    } else {
      console.log("No tool called");
      return "Something went wrong";
    }
  } catch (error) {
    console.log(error);
    return "Something went wrong";
  }
};

export {
  fetchNewMessagesFromChannel,
  storeMessagesInMongoDB,
  fetchAndStoreMessages,
};
