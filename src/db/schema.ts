import { boolean, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    email: varchar("email", {length:256}).unique().notNull(),
    hashedPassword: varchar("hashed_password", {length:256})
        .notNull()
        .default('unset'),
    isChirpyRed: boolean("is_chirpy_red").default(false)
});

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const chirps = pgTable("chirps", {
    id: uuid("id")
        .primaryKey()
        .defaultRandom(),
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow()
        .$onUpdate(()=> new Date()),
    body: text("body").notNull(),
    userId: uuid("user_id")
        .notNull()
        .references(()=> users.id, {onDelete: 'cascade'})
});

export type Chirp = typeof chirps.$inferSelect
export type NewChirp = typeof chirps.$inferInsert


export const refreshTokens = pgTable("refresh_tokens", {
    token: varchar("token", {length:64}).primaryKey(),
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {onDelete:"cascade"}),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at")
});

export type RefreshTokens = typeof refreshTokens.$inferSelect;
export type NewRefreshTokens = typeof refreshTokens.$inferInsert;