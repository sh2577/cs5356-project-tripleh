import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/db';
import { matches, snacks, users } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { or, and, eq } from 'drizzle-orm';

// GET /api/matches - Get user's matches with details
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        // Get all matches where the user is either user1 or user2
        const userMatches = await db
            .select({
                match: matches,
                user1: users,
                user2: users,
                snack1: snacks,
                snack2: snacks,
            })
            .from(matches)
            .leftJoin(users, eq(matches.user1Id, users.id))
            .leftJoin(users, eq(matches.user2Id, users.id))
            .leftJoin(snacks, eq(matches.snack1Id, snacks.id))
            .leftJoin(snacks, eq(matches.snack2Id, snacks.id))
            .where(or(eq(matches.user1Id, user.id), eq(matches.user2Id, user.id)))
            .orderBy(matches.createdAt);

        // Format the matches to be more user-friendly
        const formattedMatches = userMatches.map((match) => {
            // Determine which user is the other person in the match
            const isUser1 = match.match.user1Id === user.id;
            const otherUser = isUser1 ? match.user2 : match.user1;
            const userSnack = isUser1 ? match.snack1 : match.snack2;
            const otherUserSnack = isUser1 ? match.snack2 : match.snack1;

            return {
                id: match.match.id,
                createdAt: match.match.createdAt,
                otherUser: {
                    id: otherUser?.id,
                    name: otherUser?.name,
                    image: otherUser?.image,
                },
                userSnack: {
                    id: userSnack?.id,
                    name: userSnack?.name,
                    imageUrl: userSnack?.imageUrl,
                },
                otherUserSnack: {
                    id: otherUserSnack?.id,
                    name: otherUserSnack?.name,
                    imageUrl: otherUserSnack?.imageUrl,
                },
            };
        });

        return NextResponse.json(formattedMatches);
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.error('Error fetching matches:', error);
        return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }
}
