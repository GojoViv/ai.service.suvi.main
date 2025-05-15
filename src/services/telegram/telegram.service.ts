import { TelegramMessage } from "../../models/telegram/telegram.schema";

import { createOrUpdateChannel } from "../../models/channel/channel.model";
import {
  checkForUpdates,
  getTelegramUserName,
  getTelegramChannelName,
} from "../../models/telegram/telegram.model";
import { answerChannelQuery } from "../chatbot/chatbot.service";
import { StringSession } from "telegram/sessions";
import { createInterface } from "readline";
import { TelegramClient } from "telegram";

const TRACKING_GROUP_ID = "[TRACKING_GROUP_ID]";
const API_ID = "[API_ID]";
const API_HASH = "[API_HASH]";
const PHONE_NUMBER = "[PHONE_NUMBER]";
const TARGET_GROUP = "[TARGET_GROUP_ID]";

async function getUserInput(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function processTradingMessage(text: string) {
  try {
    let solAmount = 0;
    const swapMatch = text.match(/for (\d+\.?\d*) sol/i);
    const transferMatch = text.match(/transferred (\d+\.?\d*) sol/i);

    if (swapMatch) {
      solAmount = parseFloat(swapMatch[1]);
    } else if (transferMatch) {
      solAmount = parseFloat(transferMatch[1]);
    }

    if (solAmount >= 50) {
      console.log("\n🚨 Large SOL Transaction 🚨");
      console.log(`Amount: ${solAmount} SOL`);
      console.log(`Message: ${text}`);
      console.log("-----------------\n");
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }
}

async function monitorMessages(client: any) {
  try {
    const entity = await client.getEntity(TARGET_GROUP);
    console.log("Connected to group:", entity);

    client.addEventHandler(async (update: any) => {
      if (update?.message?.text) {
        const text = update.message.text.toLowerCase();
        console.log("Received message:", text);

        if (
          text.includes("sol") &&
          (text.includes("swapped") || text.includes("transferred"))
        ) {
          await processTradingMessage(update.message.text);
        }
      }
    });
  } catch (error) {
    console.error("Error monitoring messages:", error);
  }
}

export async function startTelegramMonitor() {
  try {
    console.log("Starting Telegram client...");

    const session = new StringSession("");
    const client = new TelegramClient(session, 0, API_HASH, {
      connectionRetries: 5,
    });

    await client.start({
      phoneNumber: async () => PHONE_NUMBER,
      password: async () =>
        await getUserInput("Please enter your 2FA password (if enabled): "),
      phoneCode: async () =>
        await getUserInput("Please enter the code you received: "),
      onError: (err) => console.log(err),
    });

    console.log("Client connected successfully!");

    // Save session string for future use
    const sessionString = client.session.save();
    console.log("Save this session string:", sessionString);

    await monitorMessages(client);
  } catch (error) {
    console.error("Failed to start client:", error);
  }
}
