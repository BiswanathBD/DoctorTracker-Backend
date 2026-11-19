import { type Request, type Response, type NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { type IAuthRequest } from '../../middlewares/auth.middleware.js';
import { ApiError } from '../../utils/ApiError.js';

// cookie options helper
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
};

// admin registration
const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.registerAdmin(req.body);
    res.cookie('token', result.token, getCookieOptions());

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'admin registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// admin login
const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.loginAdmin(req.body);
    res.cookie('token', result.token, getCookieOptions());

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// admin logout
const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'logout successful',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// current admin profile
const getMe = async (req: IAuthRequest, res: Response, next: NextFunction) => {
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
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// update admin avatar
const updateAvatar = async (req: IAuthRequest, res: Response, next: NextFunction) => {
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
  } catch (error) {
    next(error);
  }
};

// delete admin avatar
const deleteAvatar = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'not authenticated');
    }

    const result = await AuthService.deleteAdminAvatar(req.user._id.toString());

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'avatar deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const AuthController = {
  register,
  login,
  logout,
  getMe,
  updateAvatar,
  deleteAvatar,
};
