import mongoose, { Document, Schema } from "mongoose";

export interface ITelegramMessage extends Document {
  projectId: mongoose.Types.ObjectId;
  projectTag: string;
  chatId: string;
  messageId: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  date: number;
  text: string;
  direction: "inbound" | "outbound";
}

interface IOffset extends Document {
  offset: number;
}

const OffsetSchema: Schema = new Schema({
  offset: { type: Number, required: true },
});

const TelegramMessageSchema: Schema = new Schema(
  {
    // Project Relations
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    projectTag: {
      type: String,
      required: true,
      index: true,
    },

    // Existing Telegram Fields
    chatId: { type: String, required: true },
    messageId: { type: Number, required: true },
    from: {
      id: { type: Number, required: true },
      is_bot: { type: Boolean, required: true },
      first_name: { type: String, required: true },
      last_name: { type: String },
      username: { type: String },
    },
    date: { type: Number, required: true },
    text: { type: String, required: true },

    // Additional fields
    direction: {
      type: String,
      required: true,
      enum: ["inbound", "outbound"],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Existing text index
TelegramMessageSchema.index({
  "from.firstName": "text",
  "from.lastName": "text",
  "from.username": "text",
  text: "text",
});

// Additional indexes for project relations
TelegramMessageSchema.index({ projectId: 1, date: -1 });
TelegramMessageSchema.index({ projectTag: 1, date: -1 });
TelegramMessageSchema.index({ chatId: 1, messageId: 1 }, { unique: true });

const TelegramMessage = mongoose.model<ITelegramMessage>(
  "TelegramMessages",
  TelegramMessageSchema
);

const Offset = mongoose.model<IOffset>("Offset", OffsetSchema);

export { TelegramMessage, Offset };
