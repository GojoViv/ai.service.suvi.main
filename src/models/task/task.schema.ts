import mongoose from "mongoose";
const { Schema } = mongoose;

const changeLogSchema = new Schema(
  {
    date: { type: Date, default: Date.now },
    fields: {
      taskName: { type: String },
      assignee: {
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
      dueDate: { type: Date },
      priority: {
        id: { type: String },
        name: { type: String },
        color: { type: String },
      },
      sprint: { type: String },
      storyPoints: {
        id: { type: String },
        name: { type: String }, // Example: "3" for 3 story points
        color: { type: String },
      },
      project: { type: String },
    },
  },
  { _id: false }
);

const taskSchema = new Schema(
  {
    taskId: { type: String, required: true, unique: true },
    taskName: { type: String },
    taskDescription: { type: String },
    assignee: {
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
    dueDate: { type: Date },
    priority: {
      id: { type: String },
      name: { type: String },
      color: { type: String },
    },
    sprint: { type: String },
    epic: { type: String },
    aiSummary: { type: String },
    changeLog: { type: Map, of: changeLogSchema, required: true },
    milestone: {
      id: { type: String },
      type: { type: String },
      select: {
        id: { type: String },
        name: { type: String },
        color: { type: String },
      },
    },
    type: {
      id: { type: String },
      name: { type: String },
      color: { type: String },
    },
    storyPoints: {
      id: { type: String },
      name: { type: String },
      color: { type: String },
    },
    projectTag: {
      type: String,
      required: true,
      default: "string_esport",
    },
  },
  { timestamps: true }
);

taskSchema.index({
  taskName: "text",
  taskDescription: "text",
  "assignee.name": "text",
  "assignee.email": "text",
  "status.name": "text",
  "priority.name": "text",
  sprint: "text",
  epic: "text",
});

const Task = mongoose.model("Task", taskSchema);

export { Task };
