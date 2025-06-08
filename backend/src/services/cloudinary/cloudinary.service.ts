import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'isi-archive',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'],
    resource_type: 'auto',
  } as any,
});

export const upload = multer({ storage: storage });

export interface CloudinaryFile {
  public_id: string;
  secure_url: string;
  original_filename: string;
  bytes: number;
  format: string;
}

export const uploadToCloudinary = async (file: Express.Multer.File): Promise<CloudinaryFile> => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'isi-archive',
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      original_filename: result.original_filename || file.originalname,
      bytes: result.bytes,
      format: result.format,
    };
  } catch (error) {
    console.error('Erreur upload Cloudinary:', error);
    throw new Error('Erreur lors de l\'upload du fichier');
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Erreur suppression Cloudinary:', error);
    throw new Error('Erreur lors de la suppression du fichier');
  }
};

export default cloudinary;
