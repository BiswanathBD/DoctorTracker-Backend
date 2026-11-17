import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';

// generate jwt token
export const generateToken = (payload: { id: string; email: string; role: string }): string => {
  const secret: Secret = process.env.JWT_SECRET || 'careguide_secret_doctor_tracker_jwt_2026';
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

  return jwt.sign(payload, secret, { expiresIn });
};

// verify jwt token
export const verifyToken = (token: string): any => {
  const secret: Secret = process.env.JWT_SECRET || 'careguide_secret_doctor_tracker_jwt_2026';
  return jwt.verify(token, secret);
};
