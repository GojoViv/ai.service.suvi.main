import mongoose from "mongoose";
const { Schema } = mongoose;

const taskDetailSchema = new Schema(
  {
    taskId: { type: String, required: true },
    taskName: { type: String },
    taskType: { type: String },
    storyPoints: { type: Number },
    assignee: {
      id: { type: String },
      name: { type: String },
      email: { type: String },
      avatarUrl: { type: String },
    },
  },
  { _id: false }
);

const dailyMetricsSchema = new Schema(
  {
    date: { type: Date, required: true },
    totalTasks: { type: Number, required: true },
    completedTasks: { type: Number, required: true },
    tasksByStatus: [
      {
        status: { type: String },
        count: { type: Number },
        tasks: [taskDetailSchema],
      },
    ],
    storyPointsCompleted: {
      total: { type: Number, required: true },
      tasks: [taskDetailSchema],
    },
    storyPointsRemaining: {
      total: { type: Number, required: true },
      tasks: [taskDetailSchema],
    },
    estimatedCompletionRate: { type: Number },
    bottlenecks: [
      {
        status: { type: String },
        count: { type: Number },
        tasks: [taskDetailSchema],
      },
    ],
    qaRejections: { type: Number },
    qaRejectionsDetails: [taskDetailSchema],
    sprintHealth: {
      type: String,
      enum: ["On Track", "At Risk", "Delayed"],
      default: "On Track",
    },
    notes: { type: String },

    totalBugs: { type: Number, required: true },
    completedBugs: { type: Number, required: true },
    bugsByStatus: [
      {
        status: { type: String },
        count: { type: Number },
        tasks: [taskDetailSchema],
      },
    ],
  },
  { _id: false }
);

const sprintAnalysisSchema = new Schema(
  {
    projectId: { type: String, required: true, ref: "Project" },
    sprintId: { type: String, required: true, unique: true, ref: "Sprint" },
    sprintName: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    dailyMetrics: [dailyMetricsSchema],
    projectTag: {
      type: String,
      required: true,
      default: "string_esport",
    },
  },
  { timestamps: true }
);

const SprintAnalysis = mongoose.model("SprintAnalysis", sprintAnalysisSchema);

export { SprintAnalysis };
