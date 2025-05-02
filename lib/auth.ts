import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from '@/database/db';
import * as schema from '@/database/schema';
import { authClient } from './auth-client';

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
    const session = await authClient.getSession();

    if (!session || !session.data?.user) {
        throw new Error('Authentication required');
    }

    return session.data.user;
};
