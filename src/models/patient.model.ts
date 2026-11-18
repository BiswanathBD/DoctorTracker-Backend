import { model, type Document, type Types } from 'mongoose';
import { patientSchema } from '../schemas/patient.schema.js';

export interface IPatient extends Document {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  condition: string;
  doctorId: Types.ObjectId;
  admissionDate: Date;
  avatar?: {
    url: string;
    key: string;
  };
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

// export patient model
export const Patient = model<IPatient>('Patient', patientSchema);
