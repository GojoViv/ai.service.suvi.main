import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY } from "../config/environment";
import logger from "../utils/logger";
import { ExternalServiceError } from "../utils/errors";

// Type definitions
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
}

// Validate required environment variables
if (!ANTHROPIC_API_KEY) {
  throw new Error(
    "Missing Anthropic API key. Please check your environment variables."
  );
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
  maxRetries: 3,
  timeout: 30000, // 30 seconds
});

/**
 * Analyzes text using Anthropic's Claude API
 * @param {string} prompt The prompt to analyze
 * @param {CompletionOptions} options Optional parameters for the completion
 * @returns {Promise<string>} The model's response
 */
async function analyzeWithAnthropic(
  prompt: string,
  options: CompletionOptions = {}
): Promise<string> {
  try {
    const {
      model = "claude-3-opus-20240229",
      temperature = 0.7,
      max_tokens = 1000,
      top_p = 1,
      top_k = 40,
      stop_sequences = [],
    } = options;

    const messages: Message[] = [{ role: "user", content: prompt }];

    const response = await anthropic.messages.create({
      model,
      messages,
      temperature,
      max_tokens,
      top_p,
      top_k,
      stop_sequences,
    });

    const content = response.content[0];
    if (!content || content.type !== "text") {
      throw new Error("No text response received from Anthropic");
    }

    return content.text;
  } catch (error) {
    logger.error({ message: "Error analyzing with Anthropic", error });
    throw new ExternalServiceError("Failed to analyze with Anthropic");
  }
}

export { anthropic, analyzeWithAnthropic };
