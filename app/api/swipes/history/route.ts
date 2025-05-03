import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/db';
import { snacks, swipes, users } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { desc, eq, and } from 'drizzle-orm';

// GET /api/swipes/history - Get user's swipe history
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        // Fetch the user's swipe history with snack and owner details
        const history = await db
            .select({
                swipe: {
                    id: swipes.id,
                    swiperUserId: swipes.swiperUserId,
                    swipedSnackId: swipes.swipedSnackId,
                    liked: swipes.liked,
                    createdAt: swipes.createdAt,
                    updatedAt: swipes.updatedAt,
                },
                snack: {
                    id: snacks.id,
                    name: snacks.name,
                    description: snacks.description,
                    location: snacks.location,
                    imageUrl: snacks.imageUrl,
                    userId: snacks.userId,
                },
                owner: {
                    id: users.id,
                    name: users.name,
                    image: users.image,
                },
            })
            .from(swipes)
            .innerJoin(snacks, eq(swipes.swipedSnackId, snacks.id))
            .innerJoin(users, eq(snacks.userId, users.id))
            .where(eq(swipes.swiperUserId, user.id))
            .orderBy(desc(swipes.createdAt));

        return NextResponse.json(history);
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.error('Error fetching swipe history:', error);
        return NextResponse.json({ error: 'Failed to fetch swipe history' }, { status: 500 });
    }
}

// DELETE /api/swipes/history/:swipeId - Undo a swipe
export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        const swipeId = request.nextUrl.searchParams.get('swipeId');

        if (!swipeId) {
            return NextResponse.json({ error: 'Swipe ID is required' }, { status: 400 });
        }

        // Verify the swipe belongs to the user
        const swipeExists = await db
            .select({ id: swipes.id })
            .from(swipes)
            .where(and(eq(swipes.id, swipeId), eq(swipes.swiperUserId, user.id)))
            .limit(1);

        if (swipeExists.length === 0) {
            return NextResponse.json({ error: 'Swipe not found or you do not have access to it' }, { status: 404 });
        }

        // Delete the swipe
        await db.delete(swipes).where(eq(swipes.id, swipeId));

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.error('Error undoing swipe:', error);
        return NextResponse.json({ error: 'Failed to undo swipe' }, { status: 500 });
    }
}
