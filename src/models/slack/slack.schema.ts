import { Document, model, Schema } from "mongoose";

interface IReaction {
  name: string;
  count: number;
  users: string[];
}

interface IEdited {
  user: string;
  ts: string;
}

interface IReply {
  user: string;
  ts: string;
}

export interface ISlackMessage extends Document {
  projectId: Schema.Types.ObjectId;
  projectTag: string;
  direction: "inbound" | "outbound";
  channel_id: string;
  ts: string;
  text: string;
  user: string;
  tagged_users: string[];
  thread_ts?: string;
  reactions?: IReaction[];
  attachments?: object[];
  files?: object[];
  blocks?: object[];
  edited?: IEdited;
  replies?: IReply[];
  reply_count?: number;
  parent_user_id?: string;
  is_starred?: boolean;
  pinned_to?: string[];
  subtype?: string;
  bot_id?: string;
  app_id?: string;
  team?: string;
}

const SlackMessageSchema: Schema = new Schema(
  {
    // Project Relations
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    projectTag: {
      type: String,
      required: true,
      index: true,
    },
    direction: {
      type: String,
      required: true,
      enum: ["inbound", "outbound"],
    },

    // Existing Slack Fields
    channel_id: { type: String, required: true, index: true },
    ts: { type: String, required: true, unique: true, index: true },
    text: { type: String, required: true },
    user: { type: String, required: true },
    tagged_users: { type: [String], required: true, default: [] },
    thread_ts: { type: String, default: null, index: true },
    reactions: [
      {
        name: { type: String, required: true },
        count: { type: Number, required: true },
        users: [String],
      },
    ],
    attachments: [{ type: Object }],
    files: [{ type: Object }],
    blocks: [{ type: Object }],
    edited: { user: String, ts: String },
    replies: [{ user: String, ts: String }],
    reply_count: { type: Number, default: 0 },
    parent_user_id: { type: String, default: null },
    is_starred: { type: Boolean, default: false },
    pinned_to: [String],
    subtype: String,
    bot_id: String,
    app_id: String,
    team: String,
  },
  { timestamps: true }
);

// Existing text index
SlackMessageSchema.index({
  text: "text",
  user: "text",
});

// Existing compound index
SlackMessageSchema.index({ channel_id: 1, ts: 1 });

// New indexes for project relations
SlackMessageSchema.index({ projectId: 1, ts: -1 });
SlackMessageSchema.index({ projectTag: 1, ts: -1 });
SlackMessageSchema.index({ projectId: 1, channel_id: 1, ts: -1 });

const SlackMessage = model<ISlackMessage>("SlackMessage", SlackMessageSchema);

export { SlackMessage };
