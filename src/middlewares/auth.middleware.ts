import { type Request, type Response, type NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { Admin, type IAdmin } from '../models/admin.model.js';
import { ApiError } from '../utils/ApiError.js';

// extend express request type to include authenticated user
export interface IAuthRequest extends Request {
  user?: IAdmin;
}

// parse raw cookie header string safely without third-party dependencies
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

// protect routes with jwt and admin role verification (supports HTTP-only cookies and Bearer headers)
export const protect = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // 1. check http-only cookie (parsed or raw header)
    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers.cookie) {
      const parsed = parseCookies(req.headers.cookie);
      token = parsed.token;
    }

    // 2. fallback: check bearer token in authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(401, 'unauthorized access. please login first');
    }

    // verify token
    const decoded = verifyToken(token);

    // check if admin exists
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      throw new ApiError(401, 'user belonging to this token no longer exists');
    }

    // verify role is admin
    if (admin.role !== 'admin') {
      throw new ApiError(403, 'forbidden access. admin role required');
    }

    // attach admin to request
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
