
import { db } from "../index.js";
import { NewRefreshTokens, refreshTokens, users } from "../schema.js";
import { DatabaseError } from "../../errors.js";
import { and, eq, gt, isNull } from "drizzle-orm";


export async function createRefreshToken(token: NewRefreshTokens) {
    try {
        const [newToken] = await db
            .insert(refreshTokens)
            .values(token)
            .onConflictDoNothing()
            .returning();
        return newToken
    } catch (err) {
        throw new DatabaseError("Failed to insert refresh token", err);
    }
}

export async function getRefreshToken(tokenString: string) {
    try {
        const [token] = await db
            .select()
            .from(refreshTokens)
            .where(eq(refreshTokens.token, tokenString));
        return token;
    } catch (err) {
        throw new DatabaseError("Failed to retrieve token", err);
    }
}

export async function revokeRefreshToken(token: string) {
  const rows = await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.token, token))
    .returning();

  if (rows.length === 0) {
    throw new Error("Couldn't revoke token");
  }
}


export async function userForRefreshToken(token: string) {
  const [result] = await db
    .select({ user: users })
    .from(users)
    .innerJoin(refreshTokens, eq(users.id, refreshTokens.userId))
    .where(
      and(
        eq(refreshTokens.token, token),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return result;
}