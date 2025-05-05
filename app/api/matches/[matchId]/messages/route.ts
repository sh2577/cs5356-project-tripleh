import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/db';
import { messages, matches } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { and, eq, or, desc, gt, inArray } from 'drizzle-orm';

// GET /api/matches/[matchId]/messages - Get messages for a specific match
export async function GET(request: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
    try {
        const user = await getCurrentUser();
        const matchId = (await params).matchId;

        // Check for "since" parameter to get only messages after a certain timestamp
        const sinceParam = request.nextUrl.searchParams.get('since');
        let sinceDate: Date | null = null;

        if (sinceParam) {
            try {
                sinceDate = new Date(sinceParam);
                // Check if date is valid
                if (isNaN(sinceDate.getTime())) {
                    sinceDate = null;
                }
            } catch (error) {
                console.warn('Invalid since parameter:', sinceParam);
                // Invalid date format, ignore the parameter
                sinceDate = null;
            }
        }

        // First, verify that the user is part of this match
        const matchExists = await db
            .select({ id: matches.id })
            .from(matches)
            .where(and(eq(matches.id, matchId), or(eq(matches.user1Id, user.id), eq(matches.user2Id, user.id))))
            .limit(1);

        if (matchExists.length === 0) {
            return NextResponse.json({ error: 'Match not found or you do not have access to it' }, { status: 404 });
        }

        // Build the query conditionally based on whether we have a sinceDate
        const query = sinceDate
            ? and(eq(messages.matchId, matchId), gt(messages.createdAt, sinceDate))
            : eq(messages.matchId, matchId);

        // Get messages for this match, ordered by creation time (oldest first)
        const matchMessages = await db.select().from(messages).where(query).orderBy(messages.createdAt);

        // Mark messages from other users as read
        const otherUserMessages = matchMessages.filter((msg) => msg.senderId !== user.id && !msg.read);

        if (otherUserMessages.length > 0) {
            const messageIds = otherUserMessages.map((msg) => msg.id);

            // Update read status
            await db
                .update(messages)
                .set({ read: true })
                .where(
                    and(
                        eq(messages.matchId, matchId),
                        messageIds.length > 0 ? inArray(messages.id, messageIds) : undefined
                    )
                );
        }

        // Add a flag to identify messages sent by the current user
        const formattedMessages = matchMessages.map((message) => ({
            ...message,
            isMine: message.senderId === user.id,
        }));

        return NextResponse.json(formattedMessages);
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

// POST /api/matches/[matchId]/messages - Send a new message
export async function POST(request: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
    try {
        const user = await getCurrentUser();
        const matchId = (await params).matchId;
        const { content } = await request.json();

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
        }

        // First, verify that the user is part of this match
        const matchExists = await db
            .select({ id: matches.id })
            .from(matches)
            .where(and(eq(matches.id, matchId), or(eq(matches.user1Id, user.id), eq(matches.user2Id, user.id))))
            .limit(1);

        if (matchExists.length === 0) {
            return NextResponse.json({ error: 'Match not found or you do not have access to it' }, { status: 404 });
        }

        // Create the new message
        const newMessage = await db
            .insert(messages)
            .values({
                matchId,
                senderId: user.id,
                content,
                createdAt: new Date(),
                read: false,
            })
            .returning();

        // Add isMine flag (always true for newly sent messages)
        const formattedMessage = {
            ...newMessage[0],
            isMine: true,
        };

        return NextResponse.json(formattedMessage, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
