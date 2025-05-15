import { Schema, model, Document } from "mongoose";

interface ITeam extends Document {
  teamId: string;
  teamName: string;
  accessToken: string;
  botId: string;
}

const teamSchema = new Schema<ITeam>({
  teamId: { type: String, required: true, unique: true },
  teamName: { type: String, required: true },
  accessToken: { type: String, required: true },
  botId: { type: String, required: true },
});

const Team = model<ITeam>("Team", teamSchema);

export default Team;
export { ITeam };
