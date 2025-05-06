'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, SendIcon, Loader2, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import {
    getMessages,
    sendMessage,
    getUserMatches,
    unmatchUser,
    createMessageEventSource,
    Message,
    Match,
} from '@/lib/api';
import { MessageBubble } from '@/components/message-bubble';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MatchChatProps {
    matchId: string;
}

export function MatchChat({ matchId }: MatchChatProps) {
    const router = useRouter();
    const [match, setMatch] = useState<Match | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [unmatching, setUnmatching] = useState(false);
    const [showUnmatchDialog, setShowUnmatchDialog] = useState(false);
    const [error, setError] = useState('');
    const [lastMessageTime, setLastMessageTime] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    const fallbackPollingRef = useRef<NodeJS.Timeout | null>(null);

    // Load match details and initial messages
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');

                // Get all matches to find the current one
                const matches = await getUserMatches();
                const currentMatch = matches.find((m) => m.id === matchId);

                if (!currentMatch) {
                    setError('Match not found');
                    setLoading(false);
                    return;
                }

                setMatch(currentMatch);

                // Get initial messages for this match
                const matchMessages = await getMessages(matchId);
                setMessages(matchMessages);

                if (matchMessages.length > 0) {
                    // Find most recent message time for SSE initialization
                    const latestTime = Math.max(...matchMessages.map((m) => new Date(m.createdAt).getTime()));
                    setLastMessageTime(new Date(latestTime).toISOString());
                }

                setLoading(false);
            } catch (err) {
                console.error('Error loading chat data:', err);
                setError('Failed to load chat. Please try again later.');
                setLoading(false);
            }
        };

        fetchData();

        // Clean up the event source when component unmounts
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [matchId]);

    // Set up SSE when match is loaded and lastMessageTime is determined
    useEffect(() => {
        if (!match || loading) return;

        let usingFallback = false;

        const setupFallbackPolling = () => {
            if (fallbackPollingRef.current) {
                clearInterval(fallbackPollingRef.current);
            }

            usingFallback = true;
            setConnected(false);
            console.log('Using fallback polling mechanism');

            // Poll for new messages every 3 seconds
            fallbackPollingRef.current = setInterval(async () => {
                try {
                    // Only fetch messages newer than the last one we have
                    if (lastMessageTime) {
                        const params = new URLSearchParams({ since: lastMessageTime });
                        const newMessages = await getMessages(matchId, params.toString());

                        if (newMessages.length > 0) {
                            // Update messages state with new messages
                            setMessages((prevMessages) => {
                                // Filter out duplicates
                                const existingIds = new Set(prevMessages.map((m) => m.id));
                                const uniqueNewMessages = newMessages.filter((m) => !existingIds.has(m.id));

                                if (uniqueNewMessages.length === 0) return prevMessages;

                                // Find the latest message time
                                const latestTime = Math.max(...newMessages.map((m) => new Date(m.createdAt).getTime()));
                                setLastMessageTime(new Date(latestTime).toISOString());

                                // Sort all messages by creation time, oldest at top
                                const allMessages = [...prevMessages, ...uniqueNewMessages].sort(
                                    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                                );

                                return allMessages;
                            });
                        }
                    }
                } catch (err) {
                    console.error('Error polling for messages:', err);
                }
            }, 3000);
        };

        // Create the EventSource for SSE
        const eventSource = createMessageEventSource(matchId, lastMessageTime || undefined);
        eventSourceRef.current = eventSource;

        if (!eventSource) {
            console.error('EventSource not supported or failed to create - using fallback');
            setupFallbackPolling();
            return;
        }

        // Connection established
        eventSource.addEventListener('connected', () => {
            setConnected(true);
            console.log('SSE Connection established');

            // Clear any fallback polling if it was being used
            if (fallbackPollingRef.current) {
                clearInterval(fallbackPollingRef.current);
                fallbackPollingRef.current = null;
            }

            usingFallback = false;
        });

        // New messages received
        eventSource.addEventListener('messages', (event) => {
            try {
                const newMessages = JSON.parse(event.data) as Message[];
                if (newMessages.length > 0) {
                    // Add new messages to state
                    setMessages((prevMessages) => {
                        // Filter out duplicates
                        const existingIds = new Set(prevMessages.map((m) => m.id));
                        const uniqueNewMessages = newMessages.filter((m) => !existingIds.has(m.id));

                        if (uniqueNewMessages.length === 0) return prevMessages;

                        // Update lastMessageTime for future connections
                        const latestTime = Math.max(...newMessages.map((m) => new Date(m.createdAt).getTime()));
                        setLastMessageTime(new Date(latestTime).toISOString());

                        // Sort all messages by creation time, oldest at top
                        const allMessages = [...prevMessages, ...uniqueNewMessages].sort(
                            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        );

                        return allMessages;
                    });
                }
            } catch (err) {
                console.error('Error processing message event:', err);
            }
        });

        // Error handling
        eventSource.addEventListener('error', (event) => {
            console.error('SSE Error:', event);
            // On error, fall back to polling if not already doing so
            if (!usingFallback) {
                setupFallbackPolling();
            }
        });

        // Clean up
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }

            if (fallbackPollingRef.current) {
                clearInterval(fallbackPollingRef.current);
                fallbackPollingRef.current = null;
            }

            setConnected(false);
        };
    }, [match, loading, matchId, lastMessageTime]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || !matchId) return;

        try {
            setSending(true);
            const sentMessage = await sendMessage(matchId, newMessage.trim());

            // Add the new message to the list immediately (optimistic update)
            setMessages((prev) => {
                // Add message and ensure proper sort order (by creation time)
                const updatedMessages = [...prev, sentMessage].sort(
                    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                return updatedMessages;
            });

            setNewMessage('');

            // Update the last message time
            setLastMessageTime(new Date(sentMessage.createdAt).toISOString());
        } catch (err) {
            console.error('Failed to send message:', err);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleUnmatchRequest = () => {
        setShowUnmatchDialog(true);
    };

    const handleUnmatch = async () => {
        if (!matchId) return;

        try {
            setUnmatching(true);
            await unmatchUser(matchId);

            toast.success('Unmatched successfully');
            router.push('/matches');
        } catch (err) {
            console.error('Failed to unmatch:', err);
            toast.error('Failed to unmatch. Please try again.');
            setUnmatching(false);
            setShowUnmatchDialog(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading conversation...</p>
            </div>
        );
    }

    if (error || !match) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="mb-4">
                    <Link
                        href="/matches"
                        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Matches
                    </Link>
                </div>

                <Alert variant="destructive" className="my-8">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error || 'Match not found'}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <>
            <main className="container mx-auto flex flex-col h-[calc(100vh-4rem)] lg:w-[60rem]">
                {/* Header */}
                <div className="p-4 border-b flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/matches" className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={match.otherUser.image || ''} alt={match.otherUser.name} />
                            <AvatarFallback>{match.otherUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-medium">{match.otherUser.name}</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                    Discussing trade: {match.userSnack.name} ↔ {match.otherUserSnack.name}
                                </span>
                                {connected && (
                                    <span className="h-2 w-2 rounded-full bg-green-500" title="Connected"></span>
                                )}
                            </div>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={handleUnmatchRequest}
                                disabled={unmatching}
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                                {unmatching ? 'Unmatching...' : 'Unmatch'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <p className="text-muted-foreground mb-2">No messages yet</p>
                            <p className="text-sm text-muted-foreground max-w-md">
                                Start the conversation about swapping {match.userSnack.name} with{' '}
                                {match.otherUserSnack.name}!
                            </p>
                        </div>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <MessageBubble key={message.id} message={message} />
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t flex flex-col gap-1">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (newMessage.trim()) {
                                            handleSendMessage(e);
                                        }
                                    }
                                }}
                                placeholder="Type a message..."
                                className="resize-none min-h-[50px] max-h-[100px] pr-2"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={sending || !newMessage.trim()}
                            className="shrink-0 h-auto self-stretch flex items-center justify-center px-4"
                        >
                            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendIcon className="h-5 w-5" />}
                        </Button>
                    </div>
                </form>
            </main>

            {/* Unmatch Confirmation Dialog */}
            <AlertDialog open={showUnmatchDialog} onOpenChange={setShowUnmatchDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unmatch with {match.otherUser.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the match and all messages between you. Your heart history with this user
                            will also be cleared, allowing you both to potentially match again in the future if you
                            change your mind. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleUnmatch}
                            disabled={unmatching}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {unmatching ? 'Unmatching...' : 'Unmatch'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
