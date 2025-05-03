import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Search, Cookie, Heart, History } from 'lucide-react';
import Link from 'next/link';

export function MobileNav() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
                <SheetHeader className="border-b px-6 py-4">
                    <SheetTitle className="flex items-center gap-2 text-xl">
                        <Cookie className="h-6 w-6 text-primary" />
                        Snack Swap
                    </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col px-2 py-3">
                    <Link
                        href="/feed"
                        className="flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium hover:bg-muted transition-colors"
                    >
                        <Search className="h-5 w-5 text-primary" />
                        Discover
                    </Link>
                    <Link
                        href="/snacks"
                        className="flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium hover:bg-muted transition-colors"
                    >
                        <Cookie className="h-5 w-5 text-primary" />
                        My Snacks
                    </Link>
                    <Link
                        href="/matches"
                        className="flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium hover:bg-muted transition-colors"
                    >
                        <Heart className="h-5 w-5 text-primary" />
                        Matches
                    </Link>
                    <Link
                        href="/history"
                        className="flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium hover:bg-muted transition-colors"
                    >
                        <History className="h-5 w-5 text-primary" />
                        History
                    </Link>
                </nav>
            </SheetContent>
        </Sheet>
    );
}
 