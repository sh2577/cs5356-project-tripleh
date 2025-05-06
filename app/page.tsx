import { Button } from '@/components/ui/button';
import { Boxes, ArrowRight, Cookie } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
    return (
        <main className="flex-1">
            {/* Hero Section */}
            <section className="relative py-20 md:py-32 overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 mb-12 md:mb-0 md:pr-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Cookie className="text-primary h-8 w-8" />
                                <h2 className="text-xl font-bold text-primary">Snack Swap</h2>
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6">
                                Discover & Trade
                                <span className="text-primary block">Global Snacks</span>
                            </h1>
                            <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-md">
                                Connect with snack lovers worldwide and swap your favorite local treats for exotic
                                flavors from across the globe.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/auth/sign-up">
                                    <Button size="lg" className="w-full sm:w-auto">
                                        Join Now <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/feed">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                        Explore Snacks
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="md:w-1/2 relative">
                            <div className="relative h-[400px] w-full rounded-lg overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background/10 z-10 rounded-lg"></div>
                                <Image
                                    src="/snack-collage.jpg"
                                    alt="Collage of global snacks"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-muted/50">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How Snack Swap Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                                <span className="font-bold text-lg">1</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Upload Your Snacks</h3>
                            <p className="text-muted-foreground">
                                Share your favorite local snacks with photos, descriptions, and location.
                            </p>
                        </div>
                        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                                <span className="font-bold text-lg">2</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Heart on Snacks</h3>
                            <p className="text-muted-foreground">
                                Browse and press the heart button on snacks you'd like to trade for.
                            </p>
                        </div>
                        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                                <span className="font-bold text-lg">3</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Make a Match</h3>
                            <p className="text-muted-foreground">
                                When there's mutual interest, connect with your match and arrange your snack swap.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to discover global flavors?</h2>
                    <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                        Join thousands of snack enthusiasts and start your flavor adventure today.
                    </p>
                    <Link href="/auth/sign-up">
                        <Button size="lg">
                            Get Started <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </section>
            </main>
    );
}
