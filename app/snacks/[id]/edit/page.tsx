'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSnack, updateSnack, Snack, uploadImage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from '@/lib/cloudflare';
import React from 'react';

// Convert bytes to MB for display
const bytesToMB = (bytes: number) => Math.round(bytes / (1024 * 1024));

export default function EditSnackPage() {
    const params = useParams();
    // Safely access the id parameter
    const id = params?.id as string;

    const router = useRouter();
    const [snack, setSnack] = useState<Snack | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        imageUrl: '',
    });

    useEffect(() => {
        const fetchSnack = async () => {
            try {
                setLoading(true);
                const snackData = await getSnack(id);
                setSnack(snackData);

                // Initialize form with existing data
                setFormData({
                    name: snackData.name,
                    description: snackData.description,
                    location: snackData.location,
                    imageUrl: snackData.imageUrl,
                });

                // Set the existing image as preview
                setPreviewUrl(snackData.imageUrl);
            } catch (err) {
                console.error('Error fetching snack:', err);
                setError('Failed to load snack. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchSnack();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (files: FileList | null) => {
        // Reset error state
        setUploadError(null);

        if (files && files.length > 0) {
            const file = files[0];

            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                setUploadError(`File is too large. Maximum size is ${bytesToMB(MAX_FILE_SIZE)}MB.`);
                return;
            }

            // Validate file type
            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                setUploadError('File type not supported. Please upload a JPEG, PNG, WebP, GIF, or AVIF image.');
                return;
            }

            // Save the selected file
            setSelectedFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form fields
        if (
            !formData.name.trim() ||
            !formData.description.trim() ||
            !formData.location.trim() ||
            (!formData.imageUrl.trim() && !selectedFile)
        ) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            setSubmitting(true);

            // If a new image was selected, upload it
            let imageUrl = formData.imageUrl;
            if (selectedFile) {
                try {
                    imageUrl = await uploadImage(selectedFile);
                } catch (error) {
                    if (error instanceof Error) {
                        setUploadError(error.message);
                    } else {
                        setUploadError('Failed to upload image. Please try again.');
                    }
                    setSubmitting(false);
                    return;
                }
            }

            // Update the snack with possibly new image URL
            await updateSnack(id, {
                ...formData,
                imageUrl: imageUrl,
            });

            toast.success('Snack updated successfully');
            router.push('/snacks');
        } catch (err) {
            console.error('Error updating snack:', err);
            toast.error('Failed to update snack. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 container mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                    <p className="text-muted-foreground">Loading snack details...</p>
                </div>
            </div>
        );
    }

    if (error || !snack) {
        return (
            <div className="flex-1 container mx-auto px-4 py-8">
                <Link
                    href="/snacks"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to My Snacks
                </Link>

                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error || 'Snack not found'}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <main className="flex-1 container mx-auto px-4 py-8">
            <Link
                href="/snacks"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to My Snacks
            </Link>

            <h1 className="text-3xl font-bold mb-8">Edit Snack</h1>

            <Card className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Update Your Snack</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Snack Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="E.g., Maple Cookies"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe your snack and what makes it special..."
                                rows={4}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location/Origin</Label>
                            <Input
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="E.g., Toronto, Canada"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Snack Image</Label>
                            <div className="space-y-4">
                                {/* Image preview or upload area */}
                                <div className="relative w-full h-64 rounded-lg overflow-hidden group">
                                    {previewUrl ? (
                                        <>
                                            <img
                                                src={previewUrl}
                                                alt="Snack preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                                <label className="cursor-pointer text-white bg-black bg-opacity-60 px-4 py-2 rounded-md hover:bg-opacity-80 transition-colors">
                                                    <span className="text-sm font-medium flex items-center">
                                                        <Upload className="w-4 h-4 mr-2" />
                                                        Replace Image
                                                    </span>
                                                    <Input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageChange(e.target.files)}
                                                    />
                                                </label>
                                            </div>
                                        </>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg cursor-pointer bg-muted/40 hover:bg-muted/60 transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                                <p className="mb-2 text-sm text-muted-foreground">
                                                    <span className="font-semibold">Click to upload</span> or drag and
                                                    drop
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    PNG, JPG, WEBP, GIF or AVIF (MAX. {bytesToMB(MAX_FILE_SIZE)}
                                                    MB)
                                                </p>
                                            </div>
                                            <Input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleImageChange(e.target.files)}
                                            />
                                        </label>
                                    )}
                                </div>

                                {uploadError && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{uploadError}</AlertDescription>
                                    </Alert>
                                )}

                                <p className="text-xs text-muted-foreground">
                                    Upload a mouth-watering photo of your snack.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                        <Link href="/snacks">
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Snack'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </main>
    );
}
