import { Document, Types } from "mongoose";

export interface IEmployee extends Document {
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  designation: string;
  jobType: "Full Time" | "Part Time" | "Internship" | "Freelance";
  websitePortfolioLink?: string;
  githubPortfolioLink?: string;
  linkedinPortfolioLink?: string;
  currentEmploymentStatus: "Active" | "Resigned";
  notionId?: string;
  slackId?: string;
  telegramId?: string;
  discordId?: string;
  leaves: Types.ObjectId[];
  performanceReviews: Types.ObjectId[];
  roles: Types.ObjectId[];
  employeeId: string;
  uid: string;
  boards: string[];
}
