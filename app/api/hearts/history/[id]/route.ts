import { db } from '@/database/db';
import { hearts, snacks, matches } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { and, eq, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// DELETE /api/hearts/history/:heartId - Undo a heart
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getCurrentUser();
        const heartId = (await params).id;

        if (!heartId) {
            return NextResponse.json({ error: 'Heart ID is required' }, { status: 400 });
        }

        // Verify the heart belongs to the user and get heart details
        const heartDetails = await db
            .select()
            .from(hearts)
            .where(and(eq(hearts.id, heartId), eq(hearts.hearterUserId, user.id)))
            .limit(1);

        if (heartDetails.length === 0) {
            return NextResponse.json({ error: 'Heart not found or you do not have access to it' }, { status: 404 });
        }

        const heart = heartDetails[0];

        // Get the hearted snack details to find the owner
        const heartedSnackDetails = await db.select().from(snacks).where(eq(snacks.id, heart.hearterSnackId));

        const heartedSnack = heartedSnackDetails.length > 0 ? heartedSnackDetails[0] : null;

        // Delete matches first if necessary
        if (heartedSnack) {
            const otherUserId = heartedSnack.userId;

            // Get user's snacks to identify potential matches
            const userSnacks = await db.select({ id: snacks.id }).from(snacks).where(eq(snacks.userId, user.id));

            const userSnackIds = userSnacks.map((snack) => snack.id);

            // Find and delete any matches between these users involving these snacks
            if (userSnackIds.length > 0) {
                await db
                    .delete(matches)
                    .where(
                        and(
                            or(
                                and(
                                    eq(matches.user1Id, user.id),
                                    eq(matches.user2Id, otherUserId),
                                    eq(matches.snack2Id, heart.hearterSnackId)
                                ),
                                and(
                                    eq(matches.user2Id, user.id),
                                    eq(matches.user1Id, otherUserId),
                                    eq(matches.snack1Id, heart.hearterSnackId)
                                )
                            )
                        )
                    );
            }
        }

        // Delete the heart
        await db.delete(hearts).where(eq(hearts.id, heartId));

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.error('Error undoing heart:', error);
        return NextResponse.json({ error: 'Failed to undo heart', details: String(error) }, { status: 500 });
    }
}
