import OpenAI from "openai";
import { OPENAI_API_KEY } from "../config/environment";
import logger from "../utils/logger";
import { ExternalServiceError } from "../utils/errors";

// Type definitions
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

// Validate required environment variables
if (!OPENAI_API_KEY) {
  throw new Error(
    "Missing OpenAI API key. Please check your environment variables."
  );
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30000, // 30 seconds
});

/**
 * Analyzes text using OpenAI's chat completion API
 * @param {string} prompt The prompt to analyze
 * @param {ChatCompletionOptions} options Optional parameters for the chat completion
 * @returns {Promise<string>} The model's response
 */
async function analyzeWithOpenAI(
  prompt: string,
  options: ChatCompletionOptions = {}
): Promise<string> {
  try {
    const {
      model = "gpt-4",
      temperature = 0.7,
      max_tokens = 1000,
      top_p = 1,
      frequency_penalty = 0,
      presence_penalty = 0,
    } = options;

    const messages: ChatMessage[] = [{ role: "user", content: prompt }];

    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
      top_p,
      frequency_penalty,
      presence_penalty,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response content received from OpenAI");
    }

    return content;
  } catch (error) {
    logger.error({ message: "Error analyzing with OpenAI", error });
    throw new ExternalServiceError("Failed to analyze with OpenAI");
  }
}

export { openai, analyzeWithOpenAI };
