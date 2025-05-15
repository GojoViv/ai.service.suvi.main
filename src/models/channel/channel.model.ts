import ChannelModel from "./channel.schema";
import { IChannel } from "../../types";
import logger from "../../utils/logger";
import { ExternalServiceError } from "../../utils/errors";

export const createOrUpdateChannel = async (
  channel: Partial<IChannel>
): Promise<IChannel> => {
  if (!channel.id) {
    logger.error({ message: "Channel ID is required" });
    throw new ExternalServiceError("Channel ID is required");
  }

  try {
    const updatedChannel = await ChannelModel.findOneAndUpdate(
      { id: channel.id },
      channel,
      { new: true, upsert: true }
    ).exec();
    logger.info({
      message: "Channel created or updated",
      channel: updatedChannel,
    });
    return updatedChannel.toObject() as IChannel;
  } catch (error) {
    logger.error({ message: "Error creating or updating channel", error });
    throw new ExternalServiceError("Error creating or updating channel");
  }
};
