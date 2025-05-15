import mongoose, { Document } from "mongoose";

interface IProjectMetadata extends Document {
  projectId: mongoose.Types.ObjectId;
  projectTag: string;
  projectName: string;
  status: string;
  employees: Array<{
    id: string;
    name: string;
    email: string;
    designation?: string;
  }>;
  epics: Array<{
    id: string;
    name: string;
    status: string;
    completion?: number;
    priority?: string;
    owner?: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
  }>;
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
  };
  lastUpdated: Date;
}

const ProjectMetadataSchema = new mongoose.Schema<IProjectMetadata>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    projectTag: String,
    projectName: String,
    status: String,
    employees: [
      {
        _id: false,
        id: String,
        name: String,
        email: String,
        designation: String,
      },
    ],

    epics: [
      {
        _id: false,
        id: String,
        name: String,
        status: String,
        completion: Number,
        priority: String,
        owner: {
          _id: false,
          id: String,
          name: String,
          email: String,
          avatarUrl: String,
        },
      },
    ],
    taskStats: {
      total: Number,
      completed: Number,
      inProgress: Number,
      todo: Number,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const ProjectMetadata = mongoose.model<IProjectMetadata>(
  "ProjectMetadata",
  ProjectMetadataSchema
);

export { ProjectMetadata, IProjectMetadata };
