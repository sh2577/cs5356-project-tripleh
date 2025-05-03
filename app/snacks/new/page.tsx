'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Loader2, Upload, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createSnack, uploadImage } from '@/lib/api';
import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from '@/lib/cloudflare';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Convert bytes to MB for display
const bytesToMB = (bytes: number) => Math.round(bytes / (1024 * 1024));

type FormValues = {
    name: string;
    description: string;
    location: string;
    image: FileList | null;
};

export default function NewSnackPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const form = useForm<FormValues>({
        defaultValues: {
            name: '',
            description: '',
            location: '',
            image: null,
        },
    });

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

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewUrl(null);
        }
    };

    const onSubmit = async (values: FormValues) => {
        try {
            setIsSubmitting(true);

            // Upload image to Cloudflare R2
            let imageUrl = '';
            if (values.image && values.image.length > 0) {
                try {
                    imageUrl = await uploadImage(values.image[0]);
                } catch (error) {
                    if (error instanceof Error) {
                        setUploadError(error.message);
                    } else {
                        setUploadError('Failed to upload image. Please try again.');
                    }
                    setIsSubmitting(false);
                    return;
                }
            } else {
                toast.error('Please select an image for your snack');
                setIsSubmitting(false);
                return;
            }

            // Create the snack with the image URL
            await createSnack({
                name: values.name,
                description: values.description,
                location: values.location,
                imageUrl: imageUrl,
            });

            toast.success('Snack added successfully!');
            router.push('/snacks');
        } catch (error) {
            console.error('Error adding snack:', error);
            toast.error('Failed to add snack. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex-1 container mx-auto px-4 py-8">
            <div className="mb-8">
                <Link
                    href="/snacks"
                    className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to My Snacks
                </Link>
            </div>

            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Add a New Snack</h1>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Snack Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Pocky Sticks" {...field} />
                                    </FormControl>
                                    <FormDescription>What's your snack called?</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <textarea
                                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Describe what makes this snack special..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Tell others about the flavor, texture, and what makes it unique.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Tokyo, Japan" {...field} />
                                    </FormControl>
                                    <FormDescription>Where is this snack from?</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="image"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>Snack Image</FormLabel>
                                    <FormControl>
                                        <div className="space-y-4">
                                            {!previewUrl ? (
                                                // Show placeholder when no image is selected
                                                <div className="flex items-center justify-center w-full">
                                                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/40 hover:bg-muted/60 transition-colors">
                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                            <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                                            <p className="mb-2 text-sm text-muted-foreground">
                                                                <span className="font-semibold">Click to upload</span>{' '}
                                                                or drag and drop
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                PNG, JPG, WEBP, GIF or AVIF (MAX.{' '}
                                                                {bytesToMB(MAX_FILE_SIZE)}
                                                                MB)
                                                            </p>
                                                        </div>
                                                        <Input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                onChange(e.target.files);
                                                                handleImageChange(e.target.files);
                                                            }}
                                                            {...fieldProps}
                                                        />
                                                    </label>
                                                </div>
                                            ) : (
                                                // Show preview with replace option when image is selected
                                                <div className="relative w-full h-64 rounded-lg overflow-hidden group">
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
                                                                onChange={(e) => {
                                                                    onChange(e.target.files);
                                                                    handleImageChange(e.target.files);
                                                                }}
                                                                {...fieldProps}
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            )}

                                            {uploadError && (
                                                <Alert variant="destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertTitle>Error</AlertTitle>
                                                    <AlertDescription>{uploadError}</AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormDescription>Upload a mouth-watering photo of your snack.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="pt-4">
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding Snack...
                                    </>
                                ) : (
                                    'Add Snack'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </main>
    );
}
