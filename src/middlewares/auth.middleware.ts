import { type Request, type Response, type NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { Admin, type IAdmin } from '../models/admin.model.js';
import { ApiError } from '../utils/ApiError.js';

// authenticated request interface
export interface IAuthRequest extends Request {
  user?: IAdmin;
}

// parse cookie header string safely
const parseCookies = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((part) => {
    const [rawKey, ...rawVal] = part.trim().split('=');
    if (rawKey) {
      cookies[rawKey.trim()] = decodeURIComponent(rawVal.join('='));
    }
  });
  return cookies;
};

// protect routes with jwt and admin role verification
export const protect = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers.cookie) {
      const parsed = parseCookies(req.headers.cookie);
      token = parsed.token;
    }

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(401, 'unauthorized access. please login first');
    }

    const decoded = verifyToken(token);

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      throw new ApiError(401, 'user belonging to this token no longer exists');
    }

    if (admin.role !== 'admin') {
      throw new ApiError(403, 'forbidden access. admin role required');
    }

    req.user = admin;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'invalid token. please login again'));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'token expired. please login again'));
    } else {
      next(error);
    }
  }
};
