import { UserButton } from '@daveyplate/better-auth-ui';
import Link from 'next/link';
import { Cookie, History } from 'lucide-react';

import { ModeToggle } from './mode-toggle';
import { Button } from './ui/button';
import { MobileNav } from './mobile-nav';

export function Header() {
    return (
        <header className="sticky top-0 z-50 border-b bg-background/60 px-4 py-3 backdrop-blur">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MobileNav />
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                        <Cookie className="size-6 text-primary" />
                        Snack Swap
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <nav className="hidden md:flex items-center gap-4">
                        <Link href="/feed">
                            <Button variant="ghost">Discover</Button>
                        </Link>
                        <Link href="/snacks">
                            <Button variant="ghost">My Snacks</Button>
                        </Link>
                        <Link href="/matches">
                            <Button variant="ghost">Matches</Button>
                        </Link>
                        <Link href="/history">
                            <Button variant="ghost">History</Button>
                        </Link>
                    </nav>
                    <ModeToggle />
                    <UserButton />
                </div>
            </div>
        </header>
    );
}
