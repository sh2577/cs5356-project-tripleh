import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/db';
import { snacks, swipes } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { and, eq, inArray, not } from 'drizzle-orm';

// GET /api/snacks/feed - Get snacks feed for swiping
export async function GET(_: NextRequest) {
    try {
        const user = await getCurrentUser();

        // Find all the snack IDs that the user has already swiped on
        const userSwipes = await db
            .select({ snackId: swipes.swipedSnackId })
            .from(swipes)
            .where(eq(swipes.swiperUserId, user.id));

        const swipedSnackIds = userSwipes.map((swipe) => swipe.snackId);

        // Get snacks that:
        // 1. Don't belong to the current user
        // 2. Haven't been swiped on by the current user
        const snackFeed = await db
            .select()
            .from(snacks)
            .where(
                and(
                    not(eq(snacks.userId, user.id)),
                    swipedSnackIds.length > 0 ? not(inArray(snacks.id, swipedSnackIds)) : undefined
                )
            )
            .limit(10); // Limit to 10 snacks for pagination

        return NextResponse.json(snackFeed);
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.error('Error fetching snack feed:', error);
        return NextResponse.json({ error: 'Failed to fetch snack feed' }, { status: 500 });
    }
}
