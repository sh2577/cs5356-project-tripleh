import { Snack, deleteSnack } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BadgeCheck, Heart, MapPin, X, Edit, Trash2, MoreVertical, Clock, Book } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
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
import { toast } from 'sonner';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

type SnackCardProps = {
    snack: Snack;
    onLike?: (snackId: string) => void;
    onDislike?: (snackId: string) => void;
    showActions?: boolean;
    isMatch?: boolean;
    isOwner?: boolean;
    onDelete?: (snackId: string) => void;
};

export function SnackCard({
    snack,
    onLike,
    onDislike,
    showActions = true,
    isMatch = false,
    isOwner = false,
    onDelete,
}: SnackCardProps) {
    const [deleting, setDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Check if the image URL is external or local and if it's a Cloudflare URL
    const isLocalImage = snack.imageUrl.startsWith('/');
    const isCloudflareImage = snack.imageUrl.includes('.r2.dev') || snack.imageUrl.includes('.cloudflare.com');

    // Next.js Image component can handle both local images and whitelisted domains
    const useNextImage = isLocalImage || isCloudflareImage;

    const handleDeleteRequest = () => {
        setShowDeleteDialog(true);
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);

            // Show toast indicating deletion is in progress
            toast.loading('Deleting snack and associated image...');

            await deleteSnack(snack.id);

            toast.success('Snack and its image deleted successfully');

            // Call the parent's onDelete handler if provided
            if (onDelete) {
                onDelete(snack.id);
            }
        } catch (err) {
            console.error('Failed to delete snack:', err);
            toast.error('Failed to delete snack. Please try again.');
        } finally {
            setDeleting(false);
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
        <>
            <Card className="overflow-hidden h-full">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg">{snack.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(snack.updatedAt)}
                            </CardDescription>
                        </div>

                        {isMatch && (
                            <Badge>
                                <BadgeCheck className="h-3 w-3 mr-1" />
                                Match
                            </Badge>
                        )}

                        {isOwner && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Actions</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <Link href={`/snacks/${snack.id}/edit`} passHref>
                                        <DropdownMenuItem>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuItem
                                        onClick={handleDeleteRequest}
                                        disabled={deleting}
                                        variant="destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {deleting ? 'Deleting...' : 'Delete'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-2">
                    <div className="aspect-square relative rounded-md overflow-hidden mb-3">
                        {useNextImage ? (
                            <Image src={snack.imageUrl} alt={snack.name} fill className="object-cover" />
                        ) : (
                            // Fallback to a regular img tag for external URLs that haven't been whitelisted
                            <img src={snack.imageUrl} alt={snack.name} className="w-full h-full object-cover" />
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {snack.location}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-1">{snack.description}</p>
                </CardContent>
                {showActions && onLike && onDislike && (
                    <CardFooter className="flex justify-between gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full h-12 w-12 border-2 border-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            onClick={() => onDislike(snack.id)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full h-12 w-12 border-2 border-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => onLike(snack.id)}
                        >
                            <Heart className="h-5 w-5" />
                        </Button>
                    </CardFooter>
                )}
                {isOwner && (
                    <CardFooter>
                        <Link href={`/snacks/${snack.id}/edit`} className="w-full">
                            <Button variant="outline" className="w-full">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Snack
                            </Button>
                        </Link>
                    </CardFooter>
                )}
            </Card>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this snack?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your snack and remove it from our
                            servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? 'Deleting...' : 'Delete Snack'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
