import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { snacks } from './snack';

export const matches = pgTable('matches', {
    id: uuid('id').defaultRandom().primaryKey(),
    user1Id: text('user1_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    user2Id: text('user2_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    snack1Id: uuid('snack1_id')
        .notNull()
        .references(() => snacks.id, { onDelete: 'cascade' }),
    snack2Id: uuid('snack2_id')
        .notNull()
        .references(() => snacks.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
