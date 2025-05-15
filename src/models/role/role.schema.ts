import mongoose, { Model } from "mongoose";
const { Schema, model } = mongoose;
import { IRole } from "../../types";

// Role Schema
const roleSchema = new Schema<IRole>({
  roleName: { type: String, required: true, unique: true },
  permissions: [{ type: Schema.Types.ObjectId, ref: "Permission" }], // Reference to Permission documents
});

const RoleModel: Model<IRole> = model("Role", roleSchema);

export { RoleModel };
