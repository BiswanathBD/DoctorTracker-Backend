import { AuthService } from './auth.service.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ApiError } from '../../utils/ApiError.js';
// handle admin registration
const register = async (req, res, next) => {
    try {
        const result = await AuthService.registerAdmin(req.body);
        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'admin registered successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
// handle admin login
const login = async (req, res, next) => {
    try {
        const result = await AuthService.loginAdmin(req.body);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'login successful',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
// handle get current admin profile
const getMe = async (req, res, next) => {
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
                avatar: req.user.avatar,
                createdAt: req.user.createdAt,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
// handle admin avatar update
const updateAvatar = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new ApiError(401, 'not authenticated');
        }
        if (!req.file || !req.file.buffer) {
            throw new ApiError(400, 'please upload an image file');
        }
        const result = await AuthService.updateAdminAvatar(req.user._id.toString(), req.file.buffer);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'avatar updated successfully',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
export const AuthController = {
    register,
    login,
    getMe,
    updateAvatar,
};
