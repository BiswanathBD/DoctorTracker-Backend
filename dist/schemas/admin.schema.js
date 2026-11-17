import { Schema } from 'mongoose';
// admin schema definition only
export const adminSchema = new Schema({
    name: {
        type: String,
        required: [true, 'name is required'],
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
    password: {
        type: String,
        required: [true, 'password is required'],
        minlength: [6, 'password must be at least 6 characters'],
        select: false,
    },
    role: {
        type: String,
        default: 'admin',
        enum: ['admin'],
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
}, {
    timestamps: true,
});
