import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/db';
import { snacks } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { and, eq } from 'drizzle-orm';
import { extractKeyFromUrl, deleteFileFromR2 } from '@/lib/cloudflare';

// GET /api/snacks/[id] - Get a specific snack
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        const snackId = params.id;

        const snack = await db.select().from(snacks).where(eq(snacks.id, snackId)).limit(1);

        if (snack.length === 0) {
            return NextResponse.json({ error: 'Snack not found' }, { status: 404 });
        }

        // Check if the snack belongs to the user
        if (snack[0].userId !== user.id) {
            return NextResponse.json({ error: 'You do not have permission to view this snack' }, { status: 403 });
        }

        return NextResponse.json(snack[0]);
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.error('Error fetching snack:', error);
        return NextResponse.json({ error: 'Failed to fetch snack' }, { status: 500 });
    }
}

// PUT /api/snacks/[id] - Update a snack
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        const snackId = params.id;
        const { name, description, location, imageUrl } = await request.json();

        // Validate required fields
        if (!name || !description || !location || !imageUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify the snack exists and belongs to the user
        const existingSnack = await db
            .select({ id: snacks.id, userId: snacks.userId })
            .from(snacks)
            .where(eq(snacks.id, snackId))
            .limit(1);

        if (existingSnack.length === 0) {
            return NextResponse.json({ error: 'Snack not found' }, { status: 404 });
        }

        if (existingSnack[0].userId !== user.id) {
            return NextResponse.json({ error: 'You do not have permission to update this snack' }, { status: 403 });
        }

        // Update the snack
        const updatedSnack = await db
            .update(snacks)
            .set({
                name,
                description,
                location,
                imageUrl,
                updatedAt: new Date(),
            })
            .where(eq(snacks.id, snackId))
            .returning();

        return NextResponse.json(updatedSnack[0]);
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.error('Error updating snack:', error);
        return NextResponse.json({ error: 'Failed to update snack' }, { status: 500 });
    }
}

// DELETE /api/snacks/[id] - Delete a snack
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser();
        const snackId = params.id;

        // Verify the snack exists and belongs to the user
        const existingSnack = await db
            .select({ id: snacks.id, userId: snacks.userId, imageUrl: snacks.imageUrl })
            .from(snacks)
            .where(eq(snacks.id, snackId))
            .limit(1);

        if (existingSnack.length === 0) {
            return NextResponse.json({ error: 'Snack not found' }, { status: 404 });
        }

        if (existingSnack[0].userId !== user.id) {
            return NextResponse.json({ error: 'You do not have permission to delete this snack' }, { status: 403 });
        }

        // Get the snack's image URL
        const imageUrl = existingSnack[0].imageUrl;

        // Delete the snack from the database
        await db.delete(snacks).where(eq(snacks.id, snackId));

        // Delete the image from Cloudflare R2 if it's stored there
        if (imageUrl) {
            const fileKey = extractKeyFromUrl(imageUrl);

            if (fileKey) {
                try {
                    await deleteFileFromR2(fileKey);
                    console.log(`Successfully deleted image from R2: ${fileKey}`);
                } catch (error) {
                    console.error(`Failed to delete image from R2: ${fileKey}`, error);
                    // We don't want to fail the whole operation if just the image deletion fails
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.error('Error deleting snack:', error);
        return NextResponse.json({ error: 'Failed to delete snack' }, { status: 500 });
    }
}
