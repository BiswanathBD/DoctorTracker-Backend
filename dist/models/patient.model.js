import { model } from 'mongoose';
import { patientSchema } from '../schemas/patient.schema.js';
// export patient model
export const Patient = model('Patient', patientSchema);
