import { Document } from "mongoose";

export interface IChannel extends Document {
  id: string;
  name: string;
  platform: "slack" | "telegram";
  status: "active" | "left";
  lastFetchedTs: string;
}
