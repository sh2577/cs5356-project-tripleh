import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { matches } from './match';

export const messages = pgTable('messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    matchId: uuid('match_id')
        .notNull()
        .references(() => matches.id, { onDelete: 'cascade' }),
    senderId: text('sender_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    read: boolean('read').default(false).notNull(),
});
 