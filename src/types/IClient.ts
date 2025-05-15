// interfaces/IClient.ts
import { Document } from "mongoose";

export interface IContactPerson {
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
}

export interface IClient extends Document {
  name: string;
  email: string;
  phoneNumber?: string;
  website?: string;
  contactPersons: IContactPerson[];
  projects: string[];
}
