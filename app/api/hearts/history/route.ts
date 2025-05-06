import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/db';
import { snacks, hearts, users, matches } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { desc, eq } from 'drizzle-orm';

// GET /api/hearts/history - Get user's heart history
export async function GET(_: NextRequest) {
    try {
        const user = await getCurrentUser();

        // Fetch the user's heart history with snack and owner details
        const history = await db
            .select({
                heart: {
                    id: hearts.id,
                    hearterUserId: hearts.hearterUserId,
                    hearterSnackId: hearts.hearterSnackId,
                    liked: hearts.liked,
                    createdAt: hearts.createdAt,
                    updatedAt: hearts.updatedAt,
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
            .from(hearts)
            .innerJoin(snacks, eq(hearts.hearterSnackId, snacks.id))
            .innerJoin(users, eq(snacks.userId, users.id))
            .where(eq(hearts.hearterUserId, user.id))
            .orderBy(desc(hearts.createdAt));

        return NextResponse.json(history);
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.error('Error fetching heart history:', error);
        return NextResponse.json({ error: 'Failed to fetch heart history' }, { status: 500 });
    }
}
