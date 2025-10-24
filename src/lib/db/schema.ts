import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    createAt: timestamp("create_at").notNull().defaultNow(),
    updateAt: timestamp("update_at")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    email: varchar("email", {length:256}).unique().notNull()
});

export type NewUser = typeof users.$inferInsert
export type User = typeof users.$inferSelect
