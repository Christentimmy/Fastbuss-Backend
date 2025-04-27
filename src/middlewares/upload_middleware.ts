import cloudinary  from '../config/cloudinary';
import multer from 'multer';

const storage = multer.memoryStorage();

export const uploadImage = multer({ 
    storage,
    limits: { fileSize: 3 * 1024 * 1024 } ,
});

export const uploadToCloudinary = async (file: Express.Multer.File, folder: string) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: folder,
                format: "png",
                public_id: file.originalname.split('.')[0],
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        ).end(file.buffer);
    });
};
