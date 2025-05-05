import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/db';
import { matches, snacks, users } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { alias } from 'drizzle-orm/pg-core';
import { or, eq } from 'drizzle-orm';

// GET /api/matches - Get user's matches with details
export async function GET(_: NextRequest) {
    try {
        console.log('Fetching matches - start');
        const user = await getCurrentUser();
        console.log('Current user:', user.id);

        // Get all matches where the user is either user1 or user2
        const userMatches = await db
            .select()
            .from(matches)
            .where(or(eq(matches.user1Id, user.id), eq(matches.user2Id, user.id)))
            .orderBy(matches.createdAt);

        console.log('Found matches:', userMatches.length);

        // Format the matches to be more user-friendly with additional data
        const formattedMatches = await Promise.all(
            userMatches.map(async (match) => {
                // Determine which user is the other person in the match
                const isUser1 = match.user1Id === user.id;
                const otherUserId = isUser1 ? match.user2Id : match.user1Id;
                const userSnackId = isUser1 ? match.snack1Id : match.snack2Id;
                const otherSnackId = isUser1 ? match.snack2Id : match.snack1Id;

                console.log(`Processing match ${match.id} - otherUserId: ${otherUserId}`);

                // Get the other user's data
                const [otherUserData] = await db.select().from(users).where(eq(users.id, otherUserId));

                // Get the snack data
                const [userSnackData] = await db.select().from(snacks).where(eq(snacks.id, userSnackId));

                const [otherSnackData] = await db.select().from(snacks).where(eq(snacks.id, otherSnackId));

                return {
                    id: match.id,
                    createdAt: match.createdAt,
                    otherUser: {
                        id: otherUserData?.id || '',
                        name: otherUserData?.name || '',
                        image: otherUserData?.image || null,
                    },
                    userSnack: {
                        id: userSnackData?.id || '',
                        name: userSnackData?.name || '',
                        imageUrl: userSnackData?.imageUrl || '',
                    },
                    otherUserSnack: {
                        id: otherSnackData?.id || '',
                        name: otherSnackData?.name || '',
                        imageUrl: otherSnackData?.imageUrl || '',
                    },
                };
            })
        );

        console.log('Matches processed successfully');
        return NextResponse.json(formattedMatches);
    } catch (error) {
        console.error('Error fetching matches:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }

    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
