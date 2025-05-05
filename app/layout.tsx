import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import '@/styles/globals.css';

import { Header } from '@/components/header';
import type { ReactNode } from 'react';
import { Providers } from './providers';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Snack Swap - Global Snack Trading Network',
    description: 'Discover and trade your favorite local snacks with people from around the world',
};

export const viewport: Viewport = {
    initialScale: 1,
    viewportFit: 'cover',
    width: 'device-width',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: 'oklch(1 0 0)' },
        { media: '(prefers-color-scheme: dark)', color: 'oklch(0.145 0 0)' },
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <Providers>
                    <div className="flex min-h-svh flex-col">
                        <Header />

                        {children}
                    </div>
                </Providers>
            </body>
        </html>
    );
}
