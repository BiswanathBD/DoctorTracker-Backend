import { Schema } from 'mongoose';

// doctor schema definition only
export const doctorSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'doctor name is required'],
      trim: true,
      index: true,
    },
    specialization: {
      type: String,
      required: [true, 'specialization is required'],
      trim: true,
      index: true,
    },
    hospital: {
      type: String,
      required: [true, 'hospital name is required'],
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// indexes
doctorSchema.index({ name: 'text', specialization: 'text', hospital: 'text', email: 'text' });
doctorSchema.index({ createdAt: -1 });
