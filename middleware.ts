import { type NextRequest, NextResponse } from 'next/server';
import { auth } from './lib/auth';

export async function middleware(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        const redirectTo = request.nextUrl.pathname + request.nextUrl.search;
        return NextResponse.redirect(new URL(`/auth/sign-in?redirectTo=${redirectTo}`, request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Protected routes
    runtime: 'nodejs',
    matcher: ['/auth/settings', '/snacks', '/feed', '/history', '/matches'],
};
