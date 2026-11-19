import { model, type Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { adminSchema } from '../schemas/admin.schema.js';

export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin';
  avatar?: {
    url: string;
    key: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

// hash password
adminSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// compare password
adminSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const Admin = model<IAdmin>('Admin', adminSchema);
