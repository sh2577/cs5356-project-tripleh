import { NextRequest } from 'next/server';
import { db } from '@/database/db';
import { messages, matches } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { and, desc, eq, gt, inArray, or } from 'drizzle-orm';

// GET /api/matches/[matchId]/messages/sse - Real-time messages using SSE
export async function GET(request: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
    // Tell the browser to keep the connection open
    const encoder = new TextEncoder();

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
        async start(controller) {
            try {
                const user = await getCurrentUser();
                const matchId = (await params).matchId;

                // Verify the user is part of the match
                const matchCheck = await db
                    .select({ id: matches.id })
                    .from(matches)
                    .where(and(eq(matches.id, matchId), or(eq(matches.user1Id, user.id), eq(matches.user2Id, user.id))))
                    .limit(1);

                if (matchCheck.length === 0) {
                    // User is not part of this match
                    controller.enqueue(
                        encoder.encode(
                            `event: error\ndata: ${JSON.stringify({
                                error: 'Match not found or you do not have access to it',
                            })}\n\n`
                        )
                    );
                    controller.close();
                    return;
                }

                // Send a connection established message
                controller.enqueue(encoder.encode('event: connected\ndata: {}\n\n'));

                // Get the client's last message timestamp from URL params
                const lastTimeParam = request.nextUrl.searchParams.get('lastMessageTime');
                let lastTime: Date | null = null;

                if (lastTimeParam) {
                    try {
                        lastTime = new Date(lastTimeParam);
                    } catch (error) {
                        console.error('Invalid timestamp format:', error);
                    }
                }

                // Function to fetch new messages
                const fetchMessages = async () => {
                    try {
                        // Build the query conditionally based on whether we have a lastTime
                        const query = lastTime
                            ? and(eq(messages.matchId, matchId), gt(messages.createdAt, lastTime))
                            : eq(messages.matchId, matchId);

                        // Get messages, most recent first
                        const newMessages = await db
                            .select()
                            .from(messages)
                            .where(query)
                            .orderBy(desc(messages.createdAt));

                        if (newMessages.length > 0) {
                            // Mark messages from other users as read
                            const otherUserMessages = newMessages.filter(
                                (msg) => msg.senderId !== user.id && !msg.read
                            );

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

                            // Add isMine flag for client-side rendering and sort by creation time (oldest first)
                            const processedMessages = newMessages
                                .map((msg) => ({
                                    ...msg,
                                    isMine: msg.senderId === user.id,
                                }))
                                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

                            // Send new messages to the client
                            controller.enqueue(
                                encoder.encode(`event: messages\ndata: ${JSON.stringify(processedMessages)}\n\n`)
                            );

                            // Update lastTime to the most recent message
                            lastTime = new Date(
                                Math.max(...newMessages.map((msg) => new Date(msg.createdAt).getTime()))
                            );
                        }
                    } catch (error) {
                        console.error('Error fetching messages:', error);
                        // Send error event
                        controller.enqueue(
                            encoder.encode(
                                `event: error\ndata: ${JSON.stringify({
                                    error: 'Failed to fetch messages',
                                })}\n\n`
                            )
                        );
                    }
                };

                // Fetch messages immediately on connection
                await fetchMessages();

                // Set up polling for new messages (efficient for serverless)
                const messageCheckInterval = setInterval(fetchMessages, 3000); // Check every 3 seconds

                // Keep the connection alive with a heartbeat
                const heartbeatInterval = setInterval(() => {
                    controller.enqueue(encoder.encode('event: heartbeat\ndata: {}\n\n'));
                }, 30000); // 30 seconds

                // Clean up on close
                request.signal.addEventListener('abort', () => {
                    clearInterval(messageCheckInterval);
                    clearInterval(heartbeatInterval);
                });
            } catch (error) {
                console.error('SSE stream error:', error);
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
        },
    });
}
