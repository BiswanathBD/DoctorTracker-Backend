import { Schema } from 'mongoose';
// patient schema definition only
export const patientSchema = new Schema({
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
        required: [true, 'assigned doctor id is required'],
        index: true,
    },
    admissionDate: {
        type: Date,
        default: Date.now,
        index: true,
    },
}, {
    timestamps: true,
});
// indexes
patientSchema.index({ doctorId: 1, createdAt: -1 });
patientSchema.index({ condition: 1, createdAt: -1 });
patientSchema.index({ name: 'text', condition: 'text', phone: 'text' });
