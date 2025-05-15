import { Document } from "mongoose";
import { EpicTypes, EpicStatuses } from "../enums";

export interface IEpic extends Document {
  name: string;
  tag: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  clients: string[]; // Assuming the client IDs are stored as strings. Adjust if necessary.
  projectManagers: string[];
  teamMembers: string[];
  telegramChannelId?: string;
  whatsappChannelId?: string;
  slackChannelId?: string;
  sourceOfTruthLink?: string;
  kanbanBoardIds?: string[];
  projectType: EpicTypes;
  projectStatus: EpicStatuses;
  projectTag: string;
}
