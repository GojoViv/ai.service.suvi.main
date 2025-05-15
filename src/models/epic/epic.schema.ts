import mongoose from "mongoose";
const { Schema } = mongoose;

const epicSchema = new Schema(
  {
    epicId: { type: String, required: true, unique: true },
    epicName: { type: String },
    owner: {
      id: { type: String },
      name: { type: String },
      email: { type: String },
      avatarUrl: { type: String },
    },
    status: {
      id: { type: String },
      name: { type: String },
      color: { type: String },
    },
    projectTag: {
      type: String,
      required: true,
      default: "string_esport",
    },
    description: {
      type: String,
    },
    telegramChannelId: { type: String },
    whatsappChannelId: { type: String },
    slackChannelId: { type: String },
    completion: { type: Number },
    priority: {
      id: { type: String },
      name: { type: String },
      color: { type: String },
    },
    dates: {
      start: { type: String },
      end: { type: String },
    },
    summary: { type: String },
    tasks: [{ type: String, ref: "Task" }],
    isBlocking: [{ type: String, ref: "Epic" }],
    blockedBy: [{ type: String, ref: "Epic" }],
    url: { type: String },
  },
  { timestamps: true }
);

epicSchema.index({
  epicName: "text",
  "owner.name": "text",
  "owner.email": "text",
  "status.name": "text",
  "priority.name": "text",
  summary: "text",
});

const Epic = mongoose.model("Epic", epicSchema);

export { Epic };
