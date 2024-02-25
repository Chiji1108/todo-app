import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	googleId: text('googleId').notNull().unique(),
	name: text('name'),
	// email: text('email').notNull().unique(),
	// name: text('name').notNull(),
	// role: text('role', { enum: ['guest', 'member', 'editor', 'admin'] })
	// 	.notNull()
	// 	.default('member'),
});

export const usersRelations = relations(users, ({ many }) => ({
	todos: many(todos),
}));

export const todos = sqliteTable('todos', {
	id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
	userId: text('userId').notNull(),
	title: text('title').notNull(),
	completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
});

export const todosRelations = relations(todos, ({ one }) => ({
	user: one(users, {
		fields: [todos.userId],
		references: [users.id],
	}),
}));
