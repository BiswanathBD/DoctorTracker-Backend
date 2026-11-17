import { verifyToken } from '../utils/jwt.js';
import { Admin } from '../models/admin.model.js';
import { ApiError } from '../utils/ApiError.js';
// protect routes with jwt and admin role verification
export const protect = async (req, res, next) => {
    try {
        let token;
        // check bearer token in authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
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
    }
    catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(new ApiError(401, 'invalid token. please login again'));
        }
        else if (error.name === 'TokenExpiredError') {
            next(new ApiError(401, 'token expired. please login again'));
        }
        else {
            next(error);
        }
    }
};
