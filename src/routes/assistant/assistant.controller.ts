import { Request, Response } from "express";
import {
  createAssistant,
  createThread,
  getThreadMessages,
  talkToSuvi,
} from "../../services/assistant/assistant.service";
import { searchDatabase } from "../../models/db/search";
import logger from "../../utils/logger";
import { ExternalServiceError, asyncHandler } from "../../utils/errors";

export const httpCreateAssistant = asyncHandler(
  async (req: Request, res: Response) => {
    const assistant = await createAssistant();
    // Sanitize assistant data before sending
    const sanitizedAssistant = {
      ...assistant,
      apiKey: undefined,
      sensitiveConfig: undefined,
    };
    logger.info("Assistant created successfully");
    res.json({ assistant: sanitizedAssistant });
  }
);

export const httpCreateThread = asyncHandler(
  async (req: Request, res: Response) => {
    const thread = await createThread();
    // Sanitize thread data before sending
    const sanitizedThread = {
      ...thread,
      sensitiveMetadata: undefined,
    };
    logger.info("Thread created successfully", { threadId: thread.id });
    res.json({ thread: sanitizedThread });
  }
);

export const httpGetThreadMessages = asyncHandler(
  async (req: Request, res: Response) => {
    const threadId = req.params.threadId;
    if (!threadId) {
      logger.warn("Attempt to get messages without threadId");
      throw new ExternalServiceError("Thread ID is required");
    }

    const messages = await getThreadMessages(threadId);
    // Sanitize messages before sending
    const sanitizedMessages = Array.isArray(messages)
      ? messages.map((message: any) => ({
          ...message,
          sensitiveContent: undefined,
          metadata: undefined,
        }))
      : [];

    logger.info("Thread messages retrieved successfully", { threadId });
    res.json({ messages: sanitizedMessages });
  }
);

export const httpTalkToSuvi = asyncHandler(
  async (req: Request, res: Response) => {
    let threadId = req.params.threadId;

    if (!threadId) {
      logger.info("Creating new thread for conversation");
      const newThread = await createThread();
      threadId = newThread.id;
    }

    const message = req.body.message as string;
    if (!message) {
      logger.warn("Attempt to talk to Suvi without message");
      throw new ExternalServiceError("Message is required");
    }

    const results = await searchDatabase(message, 10);
    const assistantResponse = await talkToSuvi(threadId, message, results);

    // Sanitize response before sending
    const sanitizedResponse = {
      ...assistantResponse,
      sensitiveData: undefined,
      metadata: undefined,
    };

    logger.info("Suvi conversation completed", { threadId });
    res.json({ threadId, assistantResponse: sanitizedResponse });
  }
);
