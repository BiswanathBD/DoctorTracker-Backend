import { model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { adminSchema } from '../schemas/admin.schema.js';
// hash password before saving
adminSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
// compare password method
adminSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};
// export admin model
export const Admin = model('Admin', adminSchema);
