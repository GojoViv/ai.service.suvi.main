import { openai } from "../../clients";
import { ISlackMessage, SlackMessage } from "../../models/slack/slack.schema";
import {
  ITelegramMessage,
  TelegramMessage,
} from "../../models/telegram/telegram.schema";
import { Task } from "../../models/task/task.schema";
import logger from "../../utils/logger";
import { ExternalServiceError, ValidationError } from "../../utils/errors";

type Platform = "telegram" | "slack";

const generateChannelQueryResponse = async (
  platform: Platform,
  messages: string,
  chatHistory: { role: "user" | "assistant"; content: string }[],
  query: string
) => {
  const prompt =
    platform === "slack"
      ? `
  ### You are SUVI, an informational bot, for businesses sitting in their communication channels.
      You will answer the user questions based on provided messages from a channel.
      If there are no messages answer generally with regards to the channel only.
      If you do not know the answer, say so.
      If you want to mention a user send <@UserID> (Slack style of tagging)
  
  #### Messages:
  ${messages}
  
  #### Output:
  `
      : `### You are SUVI, an informational bot, for businesses sitting in their communication channels.
      You will answer the user questions based on provided messages from a channel.
      If there are no messages answer generally with regards to the channel only.
      If you do not know the answer, say so.
      If you want to mention a user send @username (Telegram style of tagging)
  
  #### Messages:
  ${messages}
  
  #### Output:`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      ...chatHistory,
      { role: "user", content: query },
    ],
  });

  return response.choices[0].message.content;
};

const processSlackMessages = (
  messagesArray: ISlackMessage[],
  botId: string
): { role: "user" | "assistant"; content: string }[] => {
  const result: { role: "user" | "assistant"; content: string }[] = [];
  let previousUserMessage = null;
  for (const message of messagesArray) {
    if (message.bot_id) {
      result.push({
        role: "user",
        content: previousUserMessage?.text ? previousUserMessage?.text : "",
      });
      result.push({ role: "assistant", content: message.text });
    } else {
      if (message.tagged_users.includes(botId)) previousUserMessage = message;
    }
  }
  return result;
};

const processTelegramMessages = (
  messagesArray: ITelegramMessage[],
  botId: string
): { role: "user" | "assistant"; content: string }[] => {
  const result: { role: "user" | "assistant"; content: string }[] = [];
  let previousUserMessage = null;
  for (const message of messagesArray) {
    if (message.from.is_bot) {
      result.push({
        role: "user",
        content: previousUserMessage?.text ? previousUserMessage?.text : "",
      });
      result.push({ role: "assistant", content: message.text });
    } else {
      if (message.text.includes(`@${botId}`)) previousUserMessage = message;
    }
  }
  return result;
};

const answerChannelQuery = async (
  platform: Platform,
  channelId: string | number,
  botId: string,
  query: string
) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).getTime();

  if (platform === "slack") {
    const messagesArray = await SlackMessage.find({
      channel_id: channelId.toString(),
      ts: { $gte: oneDayAgo.toString() },
    });

    console.log(
      "Context length: ",
      messagesArray.length,
      "\n TS: ",
      oneDayAgo.toString()
    );

    const sortedMessages = messagesArray.sort(
      (a, b) => parseFloat(b.ts) - parseFloat(a.ts)
    );

    const messages = sortedMessages
      .filter((message: any) => !message.subtype && !message.bot_id)
      .reverse()
      .map((message) => `Sender: <@${message.user}> , Message: ${message.text}`)
      .join("\n");

    const chatHistory = processSlackMessages(sortedMessages.reverse(), botId);

    const response = await generateChannelQueryResponse(
      "slack",
      messages,
      chatHistory,
      query
    );

    return response;
  } else if (platform === "telegram") {
    console.log(channelId);

    const messagesArray = await TelegramMessage.find({
      chatId: channelId,
      date: { $gte: oneDayAgo / 1000 },
    });

    console.log("Context length: ", messagesArray.length, "\n TS: ", oneDayAgo);

    const sortedMessages = messagesArray.sort((a, b) => b.date - a.date);

    const messages = sortedMessages
      .filter((message: any) => !message.from.is_bot)
      .reverse()
      .map(
        (message) =>
          `Sender: @${message.from.username} , Message: ${message.text}`
      )
      .join("\n");

    const chatHistory = processTelegramMessages(
      sortedMessages.reverse(),
      botId
    );

    const response = await generateChannelQueryResponse(
      "telegram",
      messages,
      chatHistory,
      query
    );

    return response;
  }
  return "Something went wrong";
};

const generateNotionQueryResponse = async (tasks: string, query: string) => {
  const prompt = `
  ### You are provided with tasks from a notion. Your task is to answer the query based on these tasks.
  
  #### Tasks:
  ${tasks}
  
  #### Output:
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      { role: "user", content: query },
    ],
  });

  return response.choices[0].message.content;
};

// GENERAL CHATBOT

const extractKeywords = async (query: string) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "Extract keywords from the following query for further processing.",
      },
      { role: "user", content: query },
    ],
  });

  return (
    (response?.choices[0].message?.content ?? "")
      .split(",")
      .map((keyword: any) => keyword.trim()) ?? ""
  );
};

const fetchSlackMessages = async (keywords: string[], botId: string) => {
  const messagesArray = await SlackMessage.find({
    text: { $regex: keywords.join("|"), $options: "i" },
  });

  const sortedMessages = messagesArray.sort(
    (a, b) => parseFloat(b.ts) - parseFloat(a.ts)
  );

  const messages = sortedMessages
    .filter((message: any) => !message.subtype && !message.bot_id)
    .reverse()
    .map((message) => `Sender: <@${message.user}> , Message: ${message.text}`)
    .join("\n");

  const chatHistory = processSlackMessages(sortedMessages.reverse(), botId);

  return { messages, chatHistory };
};

const fetchTelegramMessages = async (keywords: string[], botId: string) => {
  const messagesArray = await TelegramMessage.find({
    text: { $regex: keywords.join("|"), $options: "i" },
  });

  const sortedMessages = messagesArray.sort((a, b) => b.date - a.date);

  const messages = sortedMessages
    .filter((message: any) => !message.from.is_bot)
    .reverse()
    .map(
      (message) =>
        `Sender: @${message.from.username} , Message: ${message.text}`
    )
    .join("\n");

  const chatHistory = processTelegramMessages(sortedMessages.reverse(), botId);

  return { messages, chatHistory };
};

const fetchNotionTasks = async (keywords: string[]) => {
  const tasksArray = await Task.find({
    description: { $regex: keywords.join("|"), $options: "i" },
  });

  const tasks = tasksArray
    .map((task: any) => `Task: ${task.title}, Description: ${task.description}`)
    .join("\n");

  return tasks;
};

const generalChatbotQuery = async (query: string) => {
  const keywords = await extractKeywords(query);

  const [slackData, telegramData, notionTasks] = await Promise.all([
    fetchSlackMessages(keywords, "yourSlackBotId"), // Replace with your actual Slack bot ID
    fetchTelegramMessages(keywords, "yourTelegramBotId"), // Replace with your actual Telegram bot ID
    fetchNotionTasks(keywords),
  ]);

  const prompt = `
  ### You are SUVI, an informational bot for businesses, sitting on all the SaaS tools of a company and analyzing all the data.
  You will answer user questions based on the provided messages from various channels and tasks from the kanban board on notion.
  If there are no relevant messages or tasks, answer generally with regards to the channel only.
  If you do not know the answer, say so.
  If you want to mention a user, use the appropriate tagging style for the platform.

  #### Slack Messages:
  ${slackData.messages}

  #### Telegram Messages:
  ${telegramData.messages}

  #### Notion Tasks:
  ${notionTasks}

  #### Output:
  `;

  // Step 4: Generate the response using OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      { role: "user", content: query },
    ],
  });

  return response.choices[0].message.content;
};

const chatWithSuvi = async (message: string, context?: any): Promise<any> => {
  try {
    logger.info("Processing chat message", {
      messageLength: message.length,
      hasContext: !!context,
    });

    if (!message.trim()) {
      logger.warn("Empty chat message received");
      throw new ValidationError("Message cannot be empty", []);
    }

    return [];
  } catch (error) {
    logger.error("Failed to process chat message", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new ExternalServiceError("Failed to process chat message");
  }
};

export const handleChatError = async (error: Error): Promise<any> => {
  logger.error("Chat error occurred", {
    error: error.message,
    stack: error.stack,
  });

  return {
    type: "error",
    message: "An error occurred while processing your message",
    details: error.message,
  };
};

export {
  answerChannelQuery,
  generateNotionQueryResponse,
  generalChatbotQuery,
  chatWithSuvi,
};
