import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { WebSocket } from 'ws';

// Configure neon for serverless
if (process.env.NODE_ENV === 'production') {
    neonConfig.webSocketConstructor = WebSocket;
    neonConfig.poolQueryViaFetch = true;
} else {
    neonConfig.wsProxy = (host) => `${host}:5433/v1`;
    neonConfig.useSecureWebSocket = false;
    neonConfig.pipelineTLS = false;
    neonConfig.pipelineConnect = false;
}

async function main() {
    console.log('Running migrations...');

    const connectionString =
        process.env.NODE_ENV === 'production' ? process.env.DATABASE_URL : process.env.LOCAL_DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL or LOCAL_DATABASE_URL is required');
    }

    const pool = new Pool({ connectionString });
    const db = drizzle(pool);

    // Run migrations
    try {
        await migrate(db, { migrationsFolder: 'drizzle/migrations' });
        console.log('Migrations completed successfully');
    } catch (error) {
        console.error('Error running migrations:', error);
        process.exit(1);
    }

    // Close the pool
    await pool.end();
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
