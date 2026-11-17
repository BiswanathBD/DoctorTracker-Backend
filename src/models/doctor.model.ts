import { model, type Document } from 'mongoose';
import { doctorSchema } from '../schemas/doctor.schema.js';

export interface IDoctor extends Document {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  avatar?: {
    url: string;
    key: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// export doctor model
export const Doctor = model<IDoctor>('Doctor', doctorSchema);
