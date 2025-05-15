import mongoose, { Schema } from "mongoose";

const EmployeeRoleSchema = new mongoose.Schema({
  employeeEmail: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["management", "engineering", "product", "design"],
  },
  assignedProjects: {
    type: [Schema.Types.ObjectId],
    ref: "Project",
    default: [],
  },
});

export const EmployeeRole = mongoose.model("EmployeeRole", EmployeeRoleSchema);
