'use client';

import { useEffect, useState } from 'react';
import { getUserMatches, unmatchUser, Match } from '@/lib/api';
import { SnackCard } from '@/components/snack-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, HeartHandshake, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
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

export default function MatchesPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [unmatching, setUnmatching] = useState<string | null>(null);
    const [showUnmatchDialog, setShowUnmatchDialog] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

    const loadMatches = async () => {
        try {
            setLoading(true);
            setError('');
            const userMatches = await getUserMatches();
            setMatches(userMatches);
        } catch (err) {
            setError('Failed to load matches. Please try again later.');
            console.error('Error loading matches:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMatches();
    }, []);

    // Function to format date to relative time (e.g., "2 days ago")
    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            const hours = Math.floor(diffInHours);
            return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        } else {
            const days = Math.floor(diffInHours / 24);
            return `${days} ${days === 1 ? 'day' : 'days'} ago`;
        }
    };

    const handleUnmatchRequest = (match: Match) => {
        setSelectedMatch(match);
        setShowUnmatchDialog(true);
    };

    const handleUnmatch = async () => {
        if (!selectedMatch) return;

        try {
            setUnmatching(selectedMatch.id);
            await unmatchUser(selectedMatch.id);

            // Remove the match from the local state
            setMatches((prevMatches) => prevMatches.filter((m) => m.id !== selectedMatch.id));
            toast.success('Unmatched successfully');

            // Close the dialog
            setShowUnmatchDialog(false);
            setSelectedMatch(null);
        } catch (err) {
            console.error('Failed to unmatch:', err);
            toast.error('Failed to unmatch. Please try again.');
        } finally {
            setUnmatching(null);
        }
    };

    return (
        <main className="flex-1 container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Your Matches</h1>

            {/* Loading state */}
            {loading && (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                    <p className="text-muted-foreground">Loading your matches...</p>
                </div>
            )}

            {/* Error state */}
            {error && !loading && (
                <Alert variant="destructive" className="mb-8">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* No matches state */}
            {!loading && !error && matches.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <HeartHandshake className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">No Matches Yet</h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        You haven't matched with anyone yet. Start swiping on snacks to find your first match!
                    </p>
                    <Link href="/feed">
                        <Button>Discover Snacks</Button>
                    </Link>
                </div>
            )}

            {/* Matches grid */}
            {!loading && !error && matches.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {matches.map((match) => (
                        <Card key={match.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={match.otherUser.image || ''} alt={match.otherUser.name} />
                                            <AvatarFallback>
                                                {match.otherUser.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg">{match.otherUser.name}</CardTitle>
                                            <CardDescription>
                                                Matched {formatRelativeTime(match.createdAt)}
                                            </CardDescription>
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
                                                onClick={() => handleUnmatchRequest(match)}
                                                disabled={unmatching === match.id}
                                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                            >
                                                {unmatching === match.id ? 'Unmatching...' : 'Unmatch'}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-0">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium mb-2">Your Snack</p>
                                        <div className="aspect-square relative rounded-md overflow-hidden">
                                            <img
                                                src={match.userSnack.imageUrl}
                                                alt={match.userSnack.name}
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                        <p className="text-sm mt-2 font-medium">{match.userSnack.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium mb-2">Their Snack</p>
                                        <div className="aspect-square relative rounded-md overflow-hidden">
                                            <img
                                                src={match.otherUserSnack.imageUrl}
                                                alt={match.otherUserSnack.name}
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                        <p className="text-sm mt-2 font-medium">{match.otherUserSnack.name}</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-6">
                                <Link href={`/matches/${match.id}`} className="w-full">
                                    <Button className="w-full">Message</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Unmatch Confirmation Dialog */}
            <AlertDialog open={showUnmatchDialog} onOpenChange={setShowUnmatchDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unmatch with {selectedMatch?.otherUser.name}?</AlertDialogTitle>
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
                            disabled={unmatching !== null}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {unmatching ? 'Unmatching...' : 'Unmatch'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    );
}
