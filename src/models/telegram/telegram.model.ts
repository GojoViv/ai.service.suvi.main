import { ChatAction } from "node-telegram-bot-api";
import { telegramClient } from "../../clients/telegram.client";
import { Offset, TelegramMessage } from "./telegram.schema";
import ChannelModel from "../channel/channel.schema";

const sendMessage = async (chatId: string, text: string, options = {}) => {
  try {
    return await telegramClient.sendMessage(chatId, text, options);
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

const forwardMessage = async (
  chatId: string,
  fromChatId: string,
  messageId: number,
  options = {}
) => {
  try {
    return await telegramClient.forwardMessage(
      chatId,
      fromChatId,
      messageId,
      options
    );
  } catch (error) {
    console.error("Error forwarding message:", error);
    throw error;
  }
};

const deleteMessage = async (chatId: string, messageId: number) => {
  try {
    return await telegramClient.deleteMessage(chatId, messageId);
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};

const getChat = async (chatId: string) => {
  try {
    return await telegramClient.getChat(chatId);
  } catch (error) {
    console.error("Error getting chat:", error);
    throw error;
  }
};

const getLastOffset = async (): Promise<number> => {
  const offsetDoc = await Offset.findOne();
  return offsetDoc ? offsetDoc.offset : 0;
};

const saveOffset = async (offset: number) => {
  await Offset.updateOne({}, { offset }, { upsert: true });
};

const saveMessageToDB = async (message: any) => {
  try {
    const newMessage = new TelegramMessage({
      chatId: message.chat.id,
      messageId: message.message_id,
      from: {
        id: message.from.id,
        is_bot: message.from.is_bot,
        first_name: message.from.first_name,
        last_name: message.from.last_name,
        username: message.from.username,
      },
      date: message.date,
      text: message.text,
    });

    await newMessage.save();
  } catch (error) {
    console.error("Error saving message to DB");
  }
};

const getChatMember = async (chatId: string, userId: number) => {
  try {
    return await telegramClient.getChatMember(chatId, userId);
  } catch (error) {
    console.error("Error getting chat member:", error);
    throw error;
  }
};

const sendChatAction = async (chatId: string, action: ChatAction) => {
  try {
    return await telegramClient.sendChatAction(chatId, action);
  } catch (error) {
    console.error("Error sending chat action:", error);
    throw error;
  }
};

const getUpdates = async (
  offset?: number,
  limit: number = 100,
  timeout: number = 0
) => {
  try {
    const updates = await telegramClient.getUpdates({ offset, limit, timeout });
    console.log("Got updates");

    const promises = updates.map(async (update) => {
      if (update.message && update.message.text) {
        return saveMessageToDB(update.message);
      } else if (update.my_chat_member) {
        console.log("Chat member update received");
        return Promise.resolve();
      }
    });

    await Promise.all(promises);

    return updates;
  } catch (error) {
    console.error("Error getting updates");
    throw error;
  }
};
const checkForUpdates = async () => {
  try {
    const lastOffset = await getLastOffset();
    const updates = await getUpdates(lastOffset, 100, 30);
    if (updates.length > 0) {
      const newOffset = updates[updates.length - 1].update_id + 1;
      await saveOffset(newOffset);
    }
  } catch (error) {
    console.error("Error in checkForUpdates:", error);
  }
};

const telegramUserCache: Record<number, string> = {};
const telegramChannelCache: Record<string, string> = {};

export const getTelegramUserName = async (userId: number, chatId: string) => {
  if (telegramUserCache[userId]) {
    return telegramUserCache[userId];
  }
  const member = await getChatMember(chatId, userId);
  const username = member.user.first_name;
  telegramUserCache[userId] = username;
  return username;
};

export const getTelegramChannelName = async (chatId: string) => {
  if (telegramChannelCache[chatId]) {
    return telegramChannelCache[chatId];
  }

  const channel = await ChannelModel.findOne({ id: chatId });
  const channelName = channel ? channel.name : "Unknown";

  telegramChannelCache[chatId] = channelName;
  return channelName;
};

export {
  sendMessage,
  forwardMessage,
  deleteMessage,
  getChat,
  getChatMember,
  sendChatAction,
  getUpdates,
  checkForUpdates,
  saveMessageToDB,
};
