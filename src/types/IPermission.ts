import { Document } from "mongoose";

export interface IPermission extends Document {
  resource: string;
  action: "read" | "write" | "delete" | "update";
}
