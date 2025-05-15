import { Document } from "mongoose";

export interface ICandidate extends Document {
  name?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  qualification?: string | null;
  college?: string | null;
  experience?: number | string | null;
  skills?: string | null;
  portfolioLinks?: string[] | null;
  socialMediaLinks?: string[] | null;
  resumeUrl: string;
}
