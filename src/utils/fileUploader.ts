import multer from 'multer';
import { cloudinary } from '../config/cloudinary.js';
import { ApiError } from './ApiError.js';

// memory storage
const storage = multer.memoryStorage();

// image filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'only image files are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// upload to cloudinary
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder = 'doctor-tracker/avatars'
): Promise<{ url: string; key: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(new ApiError(500, `cloudinary upload failed: ${error.message}`));
        }
        if (!result) {
          return reject(new ApiError(500, 'cloudinary upload failed with no result'));
        }
        resolve({
          url: result.secure_url,
          key: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

// delete from cloudinary
export const deleteFromCloudinary = async (key: string): Promise<void> => {
  try {
    if (!key) return;
    await cloudinary.uploader.destroy(key);
  } catch (error) {
    console.error(`failed to delete image from cloudinary with key: ${key}`, error);
  }
};
