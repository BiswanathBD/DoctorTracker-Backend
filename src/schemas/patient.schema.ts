import { Schema } from 'mongoose';

// patient schema
export const patientSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'patient name is required'],
      trim: true,
      index: true,
    },
    age: {
      type: Number,
      required: [true, 'age is required'],
      min: [0, 'age cannot be negative'],
    },
    gender: {
      type: String,
      required: [true, 'gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    phone: {
      type: String,
      required: [true, 'phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    condition: {
      type: String,
      required: [true, 'condition is required'],
      trim: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: false,
      default: null,
      index: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    releaseDate: {
      type: Date,
      default: null,
      index: true,
    },
    isReleased: {
      type: Boolean,
      default: false,
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
patientSchema.index({ doctorId: 1, isReleased: 1 });
patientSchema.index({ doctorId: 1, createdAt: -1 });
patientSchema.index({ isReleased: 1, releaseDate: -1 });
patientSchema.index({ admissionDate: -1 });
patientSchema.index({ condition: 1, createdAt: -1 });
patientSchema.index({ name: 'text', condition: 'text', phone: 'text' });
patientSchema.index({ name: 1, condition: 1 });
patientSchema.index({ phone: 1 });
patientSchema.index({ email: 1 });
patientSchema.index({ createdAt: -1 });
