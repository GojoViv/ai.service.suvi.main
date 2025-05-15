import { Schema } from "mongoose";
import mongoose from "mongoose";

const WeeklyUpdateSchema = new mongoose.Schema({
  date: Date,
  summary: String,
  achievements: [String],
  challenges: [String],
  nextSteps: [String],
  stakeholderUpdates: String,
});

const LogEntrySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["change", "decision"],
  },
  date: Date,
  description: String,
  stakeholders: [String],
  status: {
    type: String,
    enum: ["pending", "approved", "implemented", "rejected"],
  },
  rationale: String,
  impact: String,
});

const ChannelConfigSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["slack", "whatsapp", "telegram"],
    required: true,
  },
  channelId: String,
  purpose: {
    type: String,
    enum: ["internal", "external", "both"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  provider: {
    name: {
      type: String,
      enum: ["twilio", "direct", "slack"],
    },
    config: {
      accountId: String,
      serviceId: String,
    },
  },
});

const ProjectDocumentationSchema = new mongoose.Schema({
  productOverview: {
    notionPageId: String,
    content: String,
  },

  weeklyUpdates: {
    notionPageId: String,
    updates: [WeeklyUpdateSchema],
    lastUpdated: Date,
  },

  changeLogs: {
    notionPageId: String,
    entries: [LogEntrySchema],
    lastUpdated: Date,
  },

  clientDocs: {
    notionPageId: String,
    lastUpdated: Date,
    documents: [
      {
        title: String,
        type: String,
        content: String,
        version: String,
        lastUpdated: Date,
      },
    ],
  },

  research: {
    notionPageId: String,
    lastUpdated: Date,
    documents: [
      {
        title: String,
        category: String,
        content: String,
        findings: [String],
        implications: [String],
        references: [String],
      },
    ],
  },
});

const ProjectSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "paused", "completed", "planning"],
      default: "active",
    },

    boards: {
      sprints: {
        type: String,
        required: true,
      },
      projects: {
        type: String,
        required: true,
      },
      tasks: {
        type: String,
        required: true,
      },
      slackChannelId: {
        type: String,
        required: true,
      },
    },

    links: {
      design: {
        internal: String,
        client: String,
      },
      deployment: {
        staging: String,
        production: String,
      },
    },

    communication: {
      channels: {
        internal: [ChannelConfigSchema],
        external: [ChannelConfigSchema],
      },
      preferences: {
        primaryChannel: String,
        notificationPreferences: {
          deployments: Boolean,
          meetings: Boolean,
          updates: Boolean,
        },
      },
    },

    client: {
      name: String,
      company: String,
      contacts: [
        {
          name: String,
          role: String,
          email: String,
          phone: String,
          preferredChannel: String,
        },
      ],
    },
    documentation: ProjectDocumentationSchema,

    prd: {
      notionPageId: String,
      documents: [
        {
          notionPageId: String,
          content: String,
        },
      ],
    },

    metadata: {
      createdBy: String,
      lastProcessed: Date,
      tags: [String],
      integrations: {
        slack: Boolean,
        whatsapp: Boolean,
        telegram: Boolean,
        notion: Boolean,
      },
    },
    meetingsDatabaseId: String,
    meetings: [
      {
        type: Schema.Types.ObjectId,
        ref: "Meeting",
      },
    ],
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({ tag: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ "metadata.lastProcessed": 1 });

const Project = mongoose.model("Project", ProjectSchema);

export { Project };
