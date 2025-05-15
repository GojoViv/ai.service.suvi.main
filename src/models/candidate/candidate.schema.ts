import mongoose, { Schema } from "mongoose";
import { ICandidate } from "../../types/ICandidate";

const CandidateSchema: Schema = new Schema<ICandidate>({
  name: String,
  phoneNumber: String,
  email: String,
  qualification: String,
  college: String,
  experience: Schema.Types.Mixed,
  skills: String,
  portfolioLinks: [String],
  socialMediaLinks: [String],
  resumeUrl: String,
});

const CandidateModel = mongoose.model<ICandidate>("Candidate", CandidateSchema);

export default CandidateModel;
