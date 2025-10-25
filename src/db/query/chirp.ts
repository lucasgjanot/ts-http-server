import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { chirps, NewChirp } from "../schema.js";

export async function CreateChirp(chirp: NewChirp) {
    const [result] = await db
        .insert(chirps)
        .values(chirp)
        .onConflictDoNothing()
        .returning();
    return result;
}

export async function getChirps() {
    const result = await db
        .select().from(chirps)
    return result
}

export async function getChirpById(id: string) {
    const [result] = await db
        .select().from(chirps).where(eq(chirps.id, id));
    return result
}