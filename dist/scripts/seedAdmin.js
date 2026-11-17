import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Admin } from '../models/admin.model.js';
// load env
dotenv.config();
const seedAdmin = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('mongodb uri missing in env');
            process.exit(1);
        }
        await mongoose.connect(uri, {
            dbName: 'doctorTracker',
        });
        console.log('connected to mongodb for seeding...');
        // default admin credentials
        const adminData = {
            name: 'Super Admin',
            email: 'admin@careguidebd.com',
            password: 'adminpassword123',
            role: 'admin',
        };
        // check if admin already exists
        const existingAdmin = await Admin.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log(`admin with email "${adminData.email}" already exists. skipping.`);
        }
        else {
            await Admin.create(adminData);
            console.log('✅ admin created successfully:');
            console.log(`   email: ${adminData.email}`);
            console.log(`   password: ${adminData.password}`);
        }
        await mongoose.disconnect();
        console.log('seeding completed');
        process.exit(0);
    }
    catch (error) {
        console.error('failed to seed admin:', error);
        process.exit(1);
    }
};
seedAdmin();
