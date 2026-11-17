import multer from 'multer';
import { cloudinary } from '../config/cloudinary.js';
import { ApiError } from './ApiError.js';
// memory storage for file buffers
const storage = multer.memoryStorage();
// file filter for images only
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new ApiError(400, 'only image files are allowed'));
    }
};
// multer upload middleware
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5mb max
    },
});
// upload buffer directly to cloudinary
export const uploadToCloudinary = (fileBuffer, folder = 'doctor-tracker/avatars') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            folder,
            resource_type: 'image',
        }, (error, result) => {
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
        });
        uploadStream.end(fileBuffer);
    });
};
// delete image from cloudinary using key (public_id)
export const deleteFromCloudinary = async (key) => {
    try {
        if (!key)
            return;
        await cloudinary.uploader.destroy(key);
    }
    catch (error) {
        console.error(`failed to delete image from cloudinary with key: ${key}`, error);
    }
};
