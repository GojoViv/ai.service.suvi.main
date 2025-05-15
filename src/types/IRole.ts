import { Document, Types } from "mongoose";

export interface IRole extends Document {
  roleName: string;
  permissions: Types.ObjectId[]; // Reference to permissions by their ObjectId
}
