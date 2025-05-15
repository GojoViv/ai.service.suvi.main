import mongoose, { Model } from "mongoose";
import { IPermission } from "../../types";
const { Schema, model } = mongoose;
import { PermissionActions } from "../../enums";

const permissionSchema = new Schema<IPermission>({
  resource: { type: String, required: true },
  action: {
    type: String,
    required: true,
    enum: Object.values(PermissionActions),
  },
});

const PermissionModel: Model<IPermission> = model(
  "Permission",
  permissionSchema
);

export { PermissionModel };
