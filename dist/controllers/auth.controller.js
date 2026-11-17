import { Admin } from '../models/admin.model.js';
import { generateToken } from '../utils/jwt.js';
import { sendResponse } from '../utils/sendResponse.js';
import { ApiError } from '../utils/ApiError.js';
// admin login
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // validation
        if (!email || !password) {
            throw new ApiError(400, 'email and password are required');
        }
        // find admin with password field included
        const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
        if (!admin) {
            throw new ApiError(401, 'invalid email or password');
        }
        // verify password
        const isPasswordMatched = await admin.comparePassword(password);
        if (!isPasswordMatched) {
            throw new ApiError(401, 'invalid email or password');
        }
        // generate token
        const token = generateToken({
            id: admin._id.toString(),
            email: admin.email,
            role: admin.role,
        });
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'login successful',
            data: {
                token,
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
// get logged in admin profile
export const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new ApiError(401, 'not authenticated');
        }
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'profile retrieved successfully',
            data: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                createdAt: req.user.createdAt,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
// create initial admin (register)
export const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        // validation
        if (!name || !email || !password) {
            throw new ApiError(400, 'name, email and password are required');
        }
        // check if admin email exists
        const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
        if (existingAdmin) {
            throw new ApiError(409, 'admin with this email already exists');
        }
        // create new admin
        const admin = await Admin.create({
            name,
            email: email.toLowerCase(),
            password,
            role: 'admin',
        });
        // generate token
        const token = generateToken({
            id: admin._id.toString(),
            email: admin.email,
            role: admin.role,
        });
        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'admin created successfully',
            data: {
                token,
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
