import { Schema, model } from "mongoose";

const repositorySchema = new Schema({
  repoUrl: { type: String, required: true, unique: true },
  analysis: { type: Object, required: false },
  metadata: { type: Object, required: false },
  lastAnalysisDate: { type: Date, required: false },
  lastCommitHash: { type: String, required: false },
});

const Repository = model("Repository", repositorySchema);
export default Repository;
