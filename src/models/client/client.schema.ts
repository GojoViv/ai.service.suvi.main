// models/ClientModel.ts
import mongoose, { Schema, model } from "mongoose";
import { IClient, IContactPerson } from "../../types";

const ContactPersonSchema = new Schema<IContactPerson>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    role: { type: String, required: true },
  },
  { _id: false }
); // _id: false because we don't need a separate _id for sub-documents here

const ClientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String },
    website: { type: String },
    contactPersons: [ContactPersonSchema], // Embedded sub-document array
    projects: [{ type: Schema.Types.ObjectId, ref: "Project" }], // Assuming you have a Project model
  },
  { timestamps: true }
);

ClientSchema.index({
  name: "text",
  email: "text",
  website: "text",
});

export const ClientModel = model<IClient>("Client", ClientSchema);
