'use client';

import { useState, useEffect } from 'react';
import { getSwipeHistory, undoSwipe, SwipeHistoryItem } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, ThumbsUp, ThumbsDown, AlertCircle, RotateCcw, History as HistoryIcon, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

export default function HistoryPage() {
    const [history, setHistory] = useState<SwipeHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [undoing, setUndoing] = useState<string | null>(null);
    const [showUndoDialog, setShowUndoDialog] = useState(false);
    const [selectedSwipe, setSelectedSwipe] = useState<SwipeHistoryItem | null>(null);

    const loadHistory = async () => {
        try {
            setLoading(true);
            setError('');
            const swipeHistory = await getSwipeHistory();
            setHistory(swipeHistory);
        } catch (err) {
            setError('Failed to load history. Please try again later.');
            console.error('Error loading history:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleUndoRequest = (item: SwipeHistoryItem) => {
        setSelectedSwipe(item);
        setShowUndoDialog(true);
    };

    const handleUndo = async () => {
        if (!selectedSwipe) return;

        try {
            setUndoing(selectedSwipe.swipe.id);
            await undoSwipe(selectedSwipe.swipe.id);

            // Remove the swiped item from the local state
            setHistory((prevHistory) => prevHistory.filter((item) => item.swipe.id !== selectedSwipe.swipe.id));

            toast.success('Swipe decision undone successfully');

            // Close the dialog
            setShowUndoDialog(false);
            setSelectedSwipe(null);
        } catch (err) {
            console.error('Failed to undo swipe:', err);
            toast.error('Failed to undo swipe. Please try again.');
        } finally {
            setUndoing(null);
        }
    };

    // Format date nicely
    const formatDate = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateString;
        }
    };

    return (
        <main className="flex-1 container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <HistoryIcon className="h-7 w-7" />
                Swipe History
            </h1>

            {/* Loading state */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <Skeleton className="h-5 w-40 mb-1" />
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-40 w-full mb-3" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-3/4" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-10 w-full" />
                            </CardFooter>
                        </Card>
                    ))}
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

            {/* Empty state */}
            {!loading && !error && history.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <HistoryIcon className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">No Swipe History</h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        You haven't swiped on any snacks yet. Start exploring the feed to discover snacks from around
                        the world!
                    </p>
                    <Button asChild>
                        <a href="/feed">Discover Snacks</a>
                    </Button>
                </div>
            )}

            {/* History grid */}
            {!loading && !error && history.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {history.map((item) => (
                        <Card key={item.swipe.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{item.snack.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(item.swipe.createdAt)}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={item.swipe.liked ? 'default' : 'secondary'}>
                                        {item.swipe.liked ? (
                                            <>
                                                <ThumbsUp className="h-3 w-3 mr-1" /> Liked
                                            </>
                                        ) : (
                                            <>
                                                <ThumbsDown className="h-3 w-3 mr-1" /> Passed
                                            </>
                                        )}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="aspect-square relative rounded-md overflow-hidden mb-3">
                                    <img
                                        src={item.snack.imageUrl}
                                        alt={item.snack.name}
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={item.owner.image || ''} alt={item.owner.name} />
                                        <AvatarFallback>{item.owner.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{item.owner.name}</span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                                    {item.snack.description}
                                </p>
                                <p className="text-xs text-muted-foreground">Location: {item.snack.location}</p>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleUndoRequest(item)}
                                    disabled={undoing === item.swipe.id}
                                >
                                    {undoing === item.swipe.id ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Undoing...
                                        </>
                                    ) : (
                                        <>
                                            <RotateCcw className="h-4 w-4 mr-2" />
                                            Undo Decision
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Undo Confirmation Dialog */}
            <AlertDialog open={showUndoDialog} onOpenChange={setShowUndoDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Undo your decision on {selectedSwipe?.snack.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove your {selectedSwipe?.swipe.liked ? 'like' : 'pass'} decision for this
                            snack. The snack will reappear in your feed so you can make a new decision.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUndo} disabled={undoing !== null}>
                            {undoing ? 'Undoing...' : 'Undo Decision'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    );
}
