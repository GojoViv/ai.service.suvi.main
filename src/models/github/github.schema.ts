import { Schema, model, Document } from "mongoose";

interface IGitHubOrg extends Document {
  orgId: string;
  orgName: string;
  installationId: string;
}

const gitHubOrgSchema = new Schema<IGitHubOrg>({
  orgId: { type: String, required: true, unique: true, sparse: true },
  orgName: { type: String, required: true },
  installationId: { type: String, required: true },
});

const GitHubOrg = model<IGitHubOrg>("GitHubOrg", gitHubOrgSchema);

export default GitHubOrg;
export { IGitHubOrg };
