import { model } from 'mongoose';
import { doctorSchema } from '../schemas/doctor.schema.js';
// export doctor model
export const Doctor = model('Doctor', doctorSchema);
