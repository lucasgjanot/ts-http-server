import { asc, desc, eq } from "drizzle-orm";
import { db } from "../index.js";
import { chirps, NewChirp } from "../schema.js";
import { DatabaseError } from "../../errors.js";



export async function createChirp(chirp: NewChirp) {
    try {
        const [result] = await db
            .insert(chirps)
            .values(chirp)
            .onConflictDoNothing()
            .returning();
        return result;
    } catch (err) {
        throw new DatabaseError("Failed to create chirp", err);
    }
}

export async function getChirps(sort: "asc" | "desc" = "asc") {
    try {
        const sortFn = sort === "asc" ? asc : desc;

        const result = await db
            .select()
            .from(chirps)
            .orderBy(sortFn(chirps.createdAt));

        return result;
    } catch (err) {
        throw new DatabaseError("Failed to retrieve chirps", err);
    }
}

export async function getChirpsByUser(userId: string) {
    try {
        const result = await db
            .select()
            .from(chirps)
            .where(eq(chirps.userId, userId))
        return result
    } catch (err) {
        throw new DatabaseError("Failed to retrieve chirps", err);
    }
    
}

export async function getChirpById(id: string) {
    try {
        const [result] = await db
            .select()
            .from(chirps)
            .where(eq(chirps.id, id));
        return result;
    } catch (err) {
        throw new DatabaseError("Failed to retrieve chirp", err);
    }
}

export async function deleteChirp(id: string) {
    try {
        const [result] = await db
            .delete(chirps)
            .where(eq(chirps.id, id))
            .returning();
        return result;
    } catch (err) {
        throw new DatabaseError("Failed to retrieve chirp", err);
    }
}