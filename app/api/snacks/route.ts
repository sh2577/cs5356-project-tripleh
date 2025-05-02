import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/db';
import { snacks } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';

// POST /api/snacks - Create a new snack
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        const { name, description, location, imageUrl } = await request.json();

        // Validate required fields
        if (!name || !description || !location || !imageUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create the snack
        const newSnack = await db
            .insert(snacks)
            .values({
                userId: user.id,
                name,
                description,
                location,
                imageUrl,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        return NextResponse.json(newSnack[0], { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.error('Error creating snack:', error);
        return NextResponse.json({ error: 'Failed to create snack' }, { status: 500 });
    }
}

// GET /api/snacks - Get user's snacks
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        // Get all snacks belonging to the user
        const userSnacks = await db.select().from(snacks).where(eq(snacks.userId, user.id));

        return NextResponse.json(userSnacks);
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.error('Error fetching snacks:', error);
        return NextResponse.json({ error: 'Failed to fetch snacks' }, { status: 500 });
    }
}
