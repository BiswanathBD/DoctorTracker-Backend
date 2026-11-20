import { Schema } from 'mongoose';

// doctor schema
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
    avatar: {
      url: {
        type: String,
        default: '',
      },
      key: {
        type: String,
        default: '',
      },
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// indexes
doctorSchema.index({ name: 'text', specialization: 'text', hospital: 'text', email: 'text' });
doctorSchema.index({ name: 1, specialization: 1 });
doctorSchema.index({ hospital: 1, name: 1 });
doctorSchema.index({ phone: 1 });
doctorSchema.index({ createdAt: -1 });
