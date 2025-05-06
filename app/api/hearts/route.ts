import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/db';
import { snacks, hearts, matches } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { and, eq, inArray } from 'drizzle-orm';

// POST /api/hearts - Submit a heart (like/dislike)
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        const { heartedSnackId, liked } = await request.json();

        // Validate required fields
        if (!heartedSnackId || liked === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get the hearted snack to ensure it exists
        const heartedSnack = await db.select().from(snacks).where(eq(snacks.id, heartedSnackId)).limit(1);

        if (heartedSnack.length === 0) {
            return NextResponse.json({ error: 'Snack not found' }, { status: 404 });
        }

        // Ensure user isn't swiping on their own snack
        if (heartedSnack[0].userId === user.id) {
            return NextResponse.json({ error: 'Cannot heart on your own snack' }, { status: 400 });
        }

        // Record the heart
        const newHeart = await db
            .insert(hearts)
            .values({
                hearterUserId: user.id,
                hearterSnackId: heartedSnackId,
                liked,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        // Check for a match if this was a like (right heart)
        let match = null;
        if (liked) {
            // Check if the owner of the hearted snack has previously liked any of the current user's snacks
            const snackOwnerUserId = heartedSnack[0].userId;

            // Get all snacks from the current user
            const currentUserSnacks = await db.select().from(snacks).where(eq(snacks.userId, user.id));
            const currentUserSnackIds = currentUserSnacks.map((snack) => snack.id);

            // Find any hearts where the other user liked one of the current user's snacks
            const matchingHeart = await db
                .select()
                .from(hearts)
                .where(
                    and(
                        eq(hearts.hearterUserId, snackOwnerUserId),
                        eq(hearts.liked, true),
                        currentUserSnackIds.length > 0 ? inArray(hearts.hearterSnackId, currentUserSnackIds) : undefined
                    )
                );

            // If we found a match, create a match record
            if (matchingHeart.length > 0) {
                const matchedHeart = matchingHeart[0];
                match = await db
                    .insert(matches)
                    .values({
                        user1Id: user.id,
                        user2Id: snackOwnerUserId,
                        snack1Id: matchedHeart.hearterSnackId,
                        snack2Id: heartedSnackId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .returning();
            }
        }

        return NextResponse.json(
            {
                heart: newHeart[0],
                match: match ? match[0] : null,
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.error('Error processing heart:', error);
        return NextResponse.json({ error: 'Failed to process heart' }, { status: 500 });
    }
}
