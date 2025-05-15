import mongoose, { Schema, Document } from "mongoose";

export interface IMeeting extends Document {
  firefliesMeetingId: string;
  transcriptId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  participants: {
    email: string;
    name: string;
    isHost: boolean;
  }[];
  transcript: string;
  summary: string;
  topics: string[];
  actionItems: {
    text: string;
    assignee: string;
    dueDate?: Date;
  }[];
  source: string; // zoom, gmeet, etc.
  projectIds: mongoose.Types.ObjectId[]; // Reference to Project model
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema(
  {
    firefliesMeetingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    transcriptId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    participants: [
      {
        email: {
          type: String,
          required: true,
        },
        name: String,
        isHost: {
          type: Boolean,
          default: false,
        },
      },
    ],
    transcript: String,
    summary: String,
    topics: [String],
    actionItems: [
      {
        text: String,
        assignee: String,
        dueDate: Date,
      },
    ],
    source: {
      type: String,
      required: true,
    },
    projectIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    lastSyncedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

MeetingSchema.index({ startTime: -1 });
MeetingSchema.index({ projectIds: 1 });
MeetingSchema.index({ "participants.email": 1 });

export const Meeting = mongoose.model<IMeeting>("Meeting", MeetingSchema);
