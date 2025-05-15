import mongoose, { Schema, Document } from "mongoose";

export interface IRunwayVisibility extends Document {
  runway: string;
  visibility: string;
  category: string;
  timestamp: Date;
  backgroundColor: string;
  createdAt: Date;
}

const RunwayVisibilitySchema = new Schema({
  runway: { type: String, required: true },
  visibility: { type: String, required: true },
  category: { type: String, required: true },
  timestamp: { type: Date, required: true },
  backgroundColor: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

RunwayVisibilitySchema.index({ runway: 1, timestamp: -1 });

export default mongoose.model<IRunwayVisibility>(
  "RunwayVisibility",
  RunwayVisibilitySchema
);
