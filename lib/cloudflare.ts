import { S3Client } from '@aws-sdk/client-s3';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

// Maximum file size for uploads (20MB)
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes

// Allowed image MIME types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

// Create S3 client for Cloudflare R2
export const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || '',
    },
});

// Get public URL for an uploaded file
export const getPublicUrl = (key: string): string => {
    return `${process.env.CLOUDFLARE_PUBLIC_URL}/${key}`;
};

// Generate a unique file key for uploading
export const generateFileKey = (fileName: string): string => {
    const randomString = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    return `uploads/${timestamp}-${randomString}.${fileExtension}`;
};

// Validate file size and type
export const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
        };
    }

    // Check file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'File type not supported. Please upload a JPEG, PNG, WebP, GIF, or AVIF image.',
        };
    }

    return { valid: true };
};

// Extract file key from a Cloudflare R2 URL
export const extractKeyFromUrl = (url: string): string | null => {
    // Check if the URL is a Cloudflare R2 URL
    if (!url.includes('.r2.dev') && !url.includes('.cloudflare.com')) {
        return null;
    }

    // Get the path part after the domain
    const urlObj = new URL(url);
    // Remove the leading slash if it exists
    return urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
};

// Delete a file from Cloudflare R2 storage
export const deleteFileFromR2 = async (key: string): Promise<boolean> => {
    try {
        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: process.env.CLOUDFLARE_R2_BUCKET,
                Key: key,
            })
        );
        return true;
    } catch (error) {
        console.error('Error deleting file from R2:', error);
        return false;
    }
};
