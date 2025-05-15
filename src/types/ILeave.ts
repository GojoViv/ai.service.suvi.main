import { Document, Schema, Types } from "mongoose";

export interface ILeave extends Document {
  leaveType: "Annual" | "Sick" | "Unpaid" | "Maternity" | "Paternity";
  startDate: Date;
  endDate: Date;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}
