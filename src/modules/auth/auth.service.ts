import { Admin } from '../../models/admin.model.js';
import { generateToken } from '../../utils/jwt.js';
import { ApiError } from '../../utils/ApiError.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/fileUploader.js';

// register admin service
const registerAdmin = async (payload: { name: string; email: string; password: string; avatarUrl?: string }) => {
  const { name, email, password, avatarUrl } = payload;

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
    ...(avatarUrl && { avatar: { url: avatarUrl, key: '' } }),
  });

  // generate token
  const token = generateToken({
    id: admin._id.toString(),
    email: admin.email,
    role: admin.role,
  });

  return {
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    },
  };
};

// login admin service
const loginAdmin = async (payload: { email: string; password: string }) => {
  const { email, password } = payload;

  // validation
  if (!email || !password) {
    throw new ApiError(400, 'email and password are required');
  }

  // find admin with password
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

  return {
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    },
  };
};

// update admin avatar service
const updateAdminAvatar = async (adminId: string, fileBuffer: Buffer) => {
  // find existing admin
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new ApiError(404, 'admin not found');
  }

  // delete old image from cloudinary if it exists
  if (admin.avatar && admin.avatar.key) {
    await deleteFromCloudinary(admin.avatar.key);
  }

  // upload new image to cloudinary
  const { url, key } = await uploadToCloudinary(fileBuffer, 'doctor-tracker/avatars');

  // update admin avatar record
  admin.avatar = { url, key };
  await admin.save();

  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    avatar: admin.avatar,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
};

// delete admin avatar
const deleteAdminAvatar = async (adminId: string) => {
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new ApiError(404, 'admin not found');
  }

  // delete old image from cloudinary if it exists
  if (admin.avatar && admin.avatar.key) {
    await deleteFromCloudinary(admin.avatar.key);
  }

  admin.avatar = { url: '', key: '' };
  await admin.save();

  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    avatar: admin.avatar,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
};

export const AuthService = {
  registerAdmin,
  loginAdmin,
  updateAdminAvatar,
  deleteAdminAvatar,
};
