import { Schema, model } from "mongoose";

const emailSchema = new Schema({
  emailId: { type: String, unique: true, required: true },
  sender: { type: String, required: true },
  recipients: [String],
  subject: { type: String },
  body: { type: String },
  attachments: [
    {
      filename: { type: String },
      contentType: { type: String },
      size: { type: Number },
      data: { type: Buffer },
    },
  ],
  timestamp: { type: Date, required: true },
  projectTag: { type: String },
});

const Email = model("Email", emailSchema);

export default Email;
