'use client';

import { useEffect, useState } from 'react';
import { getSnackFeed, Snack, submitSwipe } from '@/lib/api';
import { SnackCard } from '@/components/snack-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

export default function FeedPage() {
    const [snacks, setSnacks] = useState<Snack[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentSnackIndex, setCurrentSnackIndex] = useState(0);
    const [allSwiped, setAllSwiped] = useState(false);
    const [showMatchAlert, setShowMatchAlert] = useState(false);
    const [matchDetails, setMatchDetails] = useState<{
        snackName: string;
        otherUserName: string;
    } | null>(null);

    // Load snacks from the API
    useEffect(() => {
        const loadSnacks = async () => {
            try {
                setLoading(true);
                setError('');
                setAllSwiped(false);
                const feedSnacks = await getSnackFeed();
                setSnacks(feedSnacks);
            } catch (err) {
                setError('Failed to load snacks. Please try again later.');
                console.error('Error loading snacks:', err);
            } finally {
                setLoading(false);
            }
        };

        loadSnacks();
    }, []);

    const currentSnack = snacks[currentSnackIndex];

    const handleLike = async (snackId: string) => {
        try {
            const response = await submitSwipe(snackId, true);

            // Check if there's a match
            if (response.match) {
                setMatchDetails({
                    snackName: currentSnack.name,
                    otherUserName: response.match.otherUser?.name || 'another user',
                });
                setShowMatchAlert(true);
            }

            // Move to the next snack
            moveToNextSnack();
        } catch (err) {
            toast.error('Failed to like snack. Please try again.');
            console.error('Error liking snack:', err);
        }
    };

    const handleDislike = async (snackId: string) => {
        try {
            await submitSwipe(snackId, false);
            moveToNextSnack();
        } catch (err) {
            toast.error('Failed to dislike snack. Please try again.');
            console.error('Error disliking snack:', err);
        }
    };

    const moveToNextSnack = () => {
        if (currentSnackIndex < snacks.length - 1) {
            setCurrentSnackIndex((prev) => prev + 1);
        } else {
            // User has swiped on all available snacks
            setAllSwiped(true);
        }
    };

    const closeMatchAlert = () => {
        setShowMatchAlert(false);
        setMatchDetails(null);
    };

    const restartFeed = async () => {
        try {
            setLoading(true);
            const feedSnacks = await getSnackFeed();
            setSnacks(feedSnacks);
            setCurrentSnackIndex(0);
            setAllSwiped(false);
        } catch (err) {
            toast.error('Failed to refresh snacks. Please try again.');
            console.error('Error refreshing snacks:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex-1 container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Discover Snacks</h1>

            {/* Loading state */}
            {loading && (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                    <p className="text-muted-foreground">Loading snacks...</p>
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

            {/* No snacks state - either initially empty or all swiped */}
            {!loading && !error && (snacks.length === 0 || allSwiped) && !showMatchAlert && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <Cookie className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">No Snacks Found</h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        There are no more snacks to discover right now. Check back later or add your own snacks!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/snacks/new">
                            <Button>Add Your Snack</Button>
                        </Link>
                        {allSwiped && (
                            <Button variant="outline" onClick={restartFeed}>
                                Refresh Feed
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Snack cards - only show if we have snacks and not all have been swiped */}
            {!loading && !error && currentSnack && !allSwiped && (
                <div className="max-w-md mx-auto">
                    <SnackCard snack={currentSnack} onLike={handleLike} onDislike={handleDislike} />
                </div>
            )}

            {/* Match alert */}
            {showMatchAlert && matchDetails && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-card border border-border rounded-lg shadow-lg p-6 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Cookie className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">It's a Match!</h2>
                        <p className="text-muted-foreground mb-6">
                            {matchDetails.otherUserName} also liked your snack! You can now arrange to swap{' '}
                            {matchDetails.snackName}.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Button onClick={closeMatchAlert} variant="outline">
                                Keep Browsing
                            </Button>
                            <Link href="/matches">
                                <Button>View Matches</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
 