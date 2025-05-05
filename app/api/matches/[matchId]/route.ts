import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/db';
import { matches, swipes, snacks } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { and, eq, or, inArray } from 'drizzle-orm';

// GET /api/matches/[matchId] - Get a specific match
export async function GET(_: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
    try {
        const user = await getCurrentUser();
        const matchId = (await params).matchId;

        // Verify that the user is part of this match
        const match = await db
            .select()
            .from(matches)
            .where(and(eq(matches.id, matchId), or(eq(matches.user1Id, user.id), eq(matches.user2Id, user.id))))
            .limit(1);

        if (match.length === 0) {
            return NextResponse.json({ error: 'Match not found or you do not have access to it' }, { status: 404 });
        }

        return NextResponse.json(match[0]);
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.error('Error fetching match:', error);
        return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 });
    }
}

// DELETE /api/matches/[matchId] - Unmatch (delete a match)
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
    try {
        const user = await getCurrentUser();
        const matchId = (await params).matchId;

        // Verify that the user is part of this match and get match details
        const matchDetails = await db
            .select()
            .from(matches)
            .where(and(eq(matches.id, matchId), or(eq(matches.user1Id, user.id), eq(matches.user2Id, user.id))))
            .limit(1);

        if (matchDetails.length === 0) {
            return NextResponse.json({ error: 'Match not found or you do not have access to it' }, { status: 404 });
        }

        const match = matchDetails[0];
        const otherUserId = match.user1Id === user.id ? match.user2Id : match.user1Id;

        // Begin transaction to delete match and related swipes
        await db.transaction(async (tx) => {
            // Delete the match first
            await tx.delete(matches).where(eq(matches.id, matchId));

            // Get the snack IDs involved in this match
            const matchSnackIds = [match.snack1Id, match.snack2Id];

            // Get all user's snacks
            const userSnacks = await tx.select({ id: snacks.id }).from(snacks).where(eq(snacks.userId, user.id));
            const userSnackIds = userSnacks.map((snack) => snack.id);

            // Get other user's snacks
            const otherUserSnacks = await tx
                .select({ id: snacks.id })
                .from(snacks)
                .where(eq(snacks.userId, otherUserId));
            const otherUserSnackIds = otherUserSnacks.map((snack) => snack.id);

            // Delete swipes from current user to other user's snacks
            if (otherUserSnackIds.length > 0) {
                await tx
                    .delete(swipes)
                    .where(and(eq(swipes.swiperUserId, user.id), inArray(swipes.swipedSnackId, otherUserSnackIds)));
            }

            // Delete swipes from other user to current user's snacks
            if (userSnackIds.length > 0) {
                await tx
                    .delete(swipes)
                    .where(and(eq(swipes.swiperUserId, otherUserId), inArray(swipes.swipedSnackId, userSnackIds)));
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.error('Error deleting match:', error);
        return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 });
    }
}
