import { Schema, model } from "mongoose";
import { IChannel } from "../../types";

const ChannelSchema = new Schema<IChannel>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ["slack", "telegram"],
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "left"],
    },
    lastFetchedTs: { type: String, required: true },
  },
  { timestamps: true }
);

ChannelSchema.index({
  name: "text",
  platform: "text",
});

const ChannelModel = model<IChannel>("Channel", ChannelSchema);

export default ChannelModel;
