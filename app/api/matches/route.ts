import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/db';
import { matches, snacks, users } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { alias } from 'drizzle-orm/pg-core';
import { or, eq } from 'drizzle-orm';

// GET /api/matches - Get user's matches with details
export async function GET(_: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Create table aliases
    const u1 = alias(users, 'u1');
    const u2 = alias(users, 'u2');
    const s1 = alias(snacks, 's1');
    const s2 = alias(snacks, 's2');

    // Join and fetch match data
    const userMatches = await db
      .select({
        match: matches,
        user1: u1,
        user2: u2,
        snack1: s1,
        snack2: s2,
      })
      .from(matches)
      .leftJoin(u1, eq(matches.user1Id, u1.id))
      .leftJoin(u2, eq(matches.user2Id, u2.id))
      .leftJoin(s1, eq(matches.snack1Id, s1.id))
      .leftJoin(s2, eq(matches.snack2Id, s2.id))
      .where(or(eq(matches.user1Id, user.id), eq(matches.user2Id, user.id)))
      .orderBy(matches.createdAt);

    // Format the data
    const formattedMatches = userMatches.map((match) => {
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
          email: otherUser?.email, 
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
