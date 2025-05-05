import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from '@/database/db';
import * as schema from '@/database/schema';
import { headers } from 'next/headers';

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
        usePlural: true,
        schema,
    }),
    emailAndPassword: {
        enabled: true,
    },
});

export const getCurrentUser = async () => {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || !session.user) {
            throw new Error('Authentication required');
        }

        return session.user;
    } catch (error) {
        console.error('Auth error:', error);
        throw new Error('Authentication required');
    }
};
