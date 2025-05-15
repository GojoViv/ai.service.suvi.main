import { WebClient } from "@slack/web-api";
import { SlackMessage } from "./slack.schema";

// ARCHIVE CHANNEL
const archiveChannel = async (slackClient: WebClient, channel_id: string) => {
  try {
    const result = await slackClient.conversations.archive({
      channel: channel_id,
    });
    return result;
  } catch (error) {
    throw error;
  }
};

// CREATE CHANNEL
const createChannel = async (
  slackClient: WebClient,
  channel_name: string,
  is_private: boolean = false
) => {
  try {
    const result = await slackClient.conversations.create({
      name: channel_name,
      is_private,
    });
    return result;
  } catch (error) {
    throw error;
  }
};

// INVITE USER TO CHANNEL
const inviteUserToChannel = async (
  slackClient: WebClient,
  channel_id: string,
  user_ids: any
) => {
  try {
    const result = await slackClient.conversations.invite({
      channel: channel_id,
      users: user_ids.join(","),
    });
    return result;
  } catch (error) {
    throw error;
  }
};

// UPDATE CHANNEL TOPIC
const updateChannelTopic = async (
  slackClient: WebClient,
  channel_id: string,
  topic: string
) => {
  try {
    const result = await slackClient.conversations.setTopic({
      channel: channel_id,
      topic,
    });
    return result;
  } catch (error) {
    throw error;
  }
};

// REPLY IN THREAD
const replyInThread = async (
  slackClient: WebClient,
  channel: string,
  thread_ts: string,
  text: string
) => {
  try {
    const result = await slackClient.chat.postMessage({
      channel,
      thread_ts,
      text,
    });
    return result;
  } catch (error) {
    throw error;
  }
};

// SEND DM
const sendDm = async (slackClient: WebClient, user: string, text: string) => {
  try {
    console.log(`[INFO] Attempting to open conversation with user: ${user}`);

    const result = await slackClient.conversations.open({
      users: user,
    });

    if (result.ok && result.channel) {
      const channel = result.channel.id ?? "";
      console.log(
        `[INFO] Successfully opened conversation with user: ${user}, channel: ${channel}`
      );

      const message = await slackClient.chat.postMessage({
        channel,
        text,
      });

      console.log(
        `[INFO] Message sent to user ${user} in channel ${channel}: ${message.ts}`
      );
      return message;
    } else {
      const errorMessage = `[ERROR] Failed to open conversation with user: ${user}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error(`[ERROR] Error in sendDm function for user ${user}`);
    throw error;
  }
};

// SEND EPHEMERAL MESSAGE
const sendEphemeralMessage = async (
  slackClient: WebClient,
  channelId: string,
  userId: string,
  message: string
) => {
  try {
    const result = await slackClient.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: message,
    });
    return result;
  } catch (error) {
    console.error(error);
  }
};

// SEND MESSAGE
const sendMessage = async (
  slackClient: WebClient,
  channelId: string,
  message: string
) => {
  try {
    const result = await slackClient.chat.postMessage({
      channel: channelId,
      text: message,
    });
    return result;
  } catch (error) {
    throw error;
  }
};

const sendMessageInThreads = async (
  slackClient: WebClient,
  channelId: string,
  title: string,
  body: string
) => {
  try {
    // First, send the main message (title)
    const mainMessage = await slackClient.chat.postMessage({
      channel: channelId,
      text: title,
    });

    // Then send the body as a reply in the thread
    if (mainMessage.ok && body) {
      await slackClient.chat.postMessage({
        channel: channelId,
        thread_ts: mainMessage.ts, // This creates the thread under the main message
        text: body,
      });
    }

    return mainMessage;
  } catch (error) {
    throw error;
  }
};
const sendMessageInBlocks = async (
  slackClient: WebClient,
  channelId: string,
  blocks: any
) => {
  try {
    const result = await slackClient.chat.postMessage({
      channel: channelId,
      blocks: blocks,
      text: "Current Sprint Review",
    });
    return result;
  } catch (error) {
    throw error;
  }
};

// ADD PIN
const addPin = async (
  slackClient: WebClient,
  channelId: string,
  messageTs: any
) => {
  try {
    const result = await slackClient.pins.add({
      channel: channelId,
      timestamp: messageTs,
    });
    return result;
  } catch (error) {
    throw error;
  }
};

// ADD USER TO USERGROUP
const addUserToUsergroup = async (
  slackClient: WebClient,
  usergroup_id: string,
  user_ids: any
) => {
  try {
    const result = await slackClient.usergroups.users.update({
      usergroup: usergroup_id,
      users: user_ids.join(","),
    });
    return result;
  } catch (error) {
    throw error;
  }
};

// CREATE USERGROUP
const createUsergroup = async (
  slackClient: WebClient,
  usergroup_name: string,
  usergroup_handle: string
) => {
  try {
    const result = await slackClient.usergroups.create({
      name: usergroup_name,
      handle: usergroup_handle,
    });
    return result;
  } catch (error) {
    throw error;
  }
};

// REMOVE USER FROM USERGROUP
const removeUserFromUsergroup = async (
  slackClient: WebClient,
  usergroup_id: string,
  user_ids: any
) => {
  try {
    const result = await slackClient.usergroups.users.update({
      usergroup: usergroup_id,
      users: user_ids.join(","),
      include_count: false,
    });
    return result;
  } catch (error) {
    throw error;
  }
};

const getMessagesByUser = async (
  slackClient: WebClient,
  user: string,
  startTs: string,
  endTs: string
) => {
  try {
    return await SlackMessage.find({
      user,
      ts: { $gte: startTs, $lte: endTs },
    });
  } catch (error) {
    throw error;
  }
};

export {
  archiveChannel,
  createChannel,
  inviteUserToChannel,
  updateChannelTopic,
  replyInThread,
  sendDm,
  sendEphemeralMessage,
  sendMessage,
  addPin,
  addUserToUsergroup,
  createUsergroup,
  removeUserFromUsergroup,
  sendMessageInBlocks,
  getMessagesByUser,
  sendMessageInThreads,
};
