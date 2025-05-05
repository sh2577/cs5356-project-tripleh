import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getCurrentUser } from '@/lib/auth';
import { s3Client, getPublicUrl, generateFileKey, validateFile, MAX_FILE_SIZE } from '@/lib/cloudflare';

// POST /api/upload - Upload a file to Cloudflare R2
export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const user = await getCurrentUser();

        // Parse the multipart form data
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        // Check if file exists
        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file size and type
        const validation = validateFile(file);
        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        // Generate a unique key for the file
        const fileKey = generateFileKey(file.name);

        // Convert the file to a buffer
        const fileBuffer = await file.arrayBuffer();

        // Upload the file to R2
        await s3Client.send(
            new PutObjectCommand({
                Bucket: process.env.CLOUDFLARE_R2_BUCKET,
                Key: fileKey,
                Body: Buffer.from(fileBuffer),
                ContentType: file.type,
                Metadata: {
                    userId: user.id,
                    originalName: file.name,
                },
            })
        );

        // Get the public URL for the uploaded file
        const publicUrl = getPublicUrl(fileKey);

        // Return the file URL
        return NextResponse.json({
            success: true,
            url: publicUrl,
            key: fileKey,
        });
    } catch (error) {
        console.error('Error uploading file:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(
            {
                error: 'Failed to upload file',
            },
            { status: 500 }
        );
    }
}

// Configure Next.js to handle large file uploads (up to 20MB)
export const config = {
    api: {
        bodyParser: false,
        responseLimit: '30mb',
    },
};
