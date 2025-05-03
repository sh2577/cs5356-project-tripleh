import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/db';
import { snacks, swipes, matches } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { and, eq, inArray } from 'drizzle-orm';

// POST /api/swipes - Submit a swipe (like/dislike)
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        const { swipedSnackId, liked } = await request.json();

        // Validate required fields
        if (!swipedSnackId || liked === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get the swiped snack to ensure it exists
        const swipedSnack = await db.select().from(snacks).where(eq(snacks.id, swipedSnackId)).limit(1);

        if (swipedSnack.length === 0) {
            return NextResponse.json({ error: 'Snack not found' }, { status: 404 });
        }

        // Ensure user isn't swiping on their own snack
        if (swipedSnack[0].userId === user.id) {
            return NextResponse.json({ error: 'Cannot swipe on your own snack' }, { status: 400 });
        }

        // Record the swipe
        const newSwipe = await db
            .insert(swipes)
            .values({
                swiperUserId: user.id,
                swipedSnackId,
                liked,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        // Check for a match if this was a like (right swipe)
        let match = null;
        if (liked) {
            // Check if the owner of the swiped snack has previously liked any of the current user's snacks
            const snackOwnerUserId = swipedSnack[0].userId;

            // Get all snacks from the current user
            const currentUserSnacks = await db.select().from(snacks).where(eq(snacks.userId, user.id));
            const currentUserSnackIds = currentUserSnacks.map((snack) => snack.id);

            // Find any swipes where the other user liked one of the current user's snacks
            const matchingSwipes = await db
                .select()
                .from(swipes)
                .where(
                    and(
                        eq(swipes.swiperUserId, snackOwnerUserId),
                        eq(swipes.liked, true),
                        currentUserSnackIds.length > 0 ? inArray(swipes.swipedSnackId, currentUserSnackIds) : undefined
                    )
                );

            // If we found a match, create a match record
            if (matchingSwipes.length > 0) {
                const matchedSwipe = matchingSwipes[0];
                match = await db
                    .insert(matches)
                    .values({
                        user1Id: user.id,
                        user2Id: snackOwnerUserId,
                        snack1Id: matchedSwipe.swipedSnackId,
                        snack2Id: swipedSnackId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .returning();
            }
        }

        return NextResponse.json(
            {
                swipe: newSwipe[0],
                match: match ? match[0] : null,
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.error('Error processing swipe:', error);
        return NextResponse.json({ error: 'Failed to process swipe' }, { status: 500 });
    }
}
 