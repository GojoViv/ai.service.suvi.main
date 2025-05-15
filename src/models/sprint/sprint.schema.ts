import mongoose from "mongoose";
const { Schema } = mongoose;

const sprintSchema = new Schema(
  {
    sprintId: { type: String, required: true, unique: true },
    sprintName: { type: String },
    startDate: {
      id: { type: String },
      type: { type: String, default: "date" },
      date: {
        start: { type: Date, required: true },
        end: { type: Date, default: null },
        time_zone: { type: String, default: null },
      },
    },
    endDate: {
      id: { type: String },
      type: { type: String, default: "date" },
      date: {
        start: { type: Date, required: true },
        end: { type: Date, default: null },
        time_zone: { type: String, default: null },
      },
    },
    dates: {
      start: { type: String },
      end: { type: String },
    },
    tasks: [{ type: String, ref: "Task" }],
    totalTasks: { type: Number },
    completedTasks: { type: Number },
    sprintStatus: {
      id: { type: String },
      name: { type: String },
      color: { type: String },
    },
    url: { type: String },
    projectTag: {
      type: String,
      required: true,
      default: "string_esport",
    },
  },
  { timestamps: true }
);

const Sprint = mongoose.model("Sprint", sprintSchema);

export { Sprint };
