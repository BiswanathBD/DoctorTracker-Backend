import jwt from 'jsonwebtoken';
// generate jwt token
export const generateToken = (payload) => {
    const secret = process.env.JWT_SECRET || 'careguide_secret_doctor_tracker_jwt_2026';
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d');
    return jwt.sign(payload, secret, { expiresIn });
};
// verify jwt token
export const verifyToken = (token) => {
    const secret = process.env.JWT_SECRET || 'careguide_secret_doctor_tracker_jwt_2026';
    return jwt.verify(token, secret);
};
