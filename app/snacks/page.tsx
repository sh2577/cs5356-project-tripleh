'use client';

import { useEffect, useState } from 'react';
import { getUserSnacks, Snack } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Cookie } from 'lucide-react';
import Link from 'next/link';
import { SnackCard } from '@/components/snack-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function MySnacksPage() {
    const [snacks, setSnacks] = useState<Snack[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadSnacks = async () => {
        try {
            setLoading(true);
            setError('');
            const userSnacks = await getUserSnacks();
            setSnacks(userSnacks);
        } catch (err) {
            setError('Failed to load your snacks. Please try again later.');
            console.error('Error loading snacks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSnacks();
    }, []);

    const handleDelete = (snackId: string) => {
        // Update the local state to remove the deleted snack
        setSnacks((prevSnacks) => prevSnacks.filter((snack) => snack.id !== snackId));
    };

    return (
        <main className="flex-1 container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Snacks</h1>
                <Link href="/snacks/new">
                    <Button>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Snack
                    </Button>
                </Link>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                    <p className="text-muted-foreground">Loading your snacks...</p>
                </div>
            )}

            {/* Error state */}
            {error && !loading && (
                <Alert variant="destructive" className="mb-8">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* No snacks state */}
            {!loading && !error && snacks.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <Cookie className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">No Snacks Added Yet</h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        You haven't added any snacks yet. Add your favorite local treats to start swapping!
                    </p>
                    <Link href="/snacks/new">
                        <Button>Add Your First Snack</Button>
                    </Link>
                </div>
            )}

            {/* Snack grid */}
            {!loading && !error && snacks.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {snacks.map((snack) => (
                        <SnackCard
                            key={snack.id}
                            snack={snack}
                            showActions={false}
                            isOwner={true}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
