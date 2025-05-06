import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { snacks } from './snack';

export const hearts = pgTable('hearts', {
    id: uuid('id').defaultRandom().primaryKey(),
    hearterUserId: text('hearter_user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    hearterSnackId: uuid('hearter_snack_id')
        .notNull()
        .references(() => snacks.id, { onDelete: 'cascade' }),
    liked: boolean('liked').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
