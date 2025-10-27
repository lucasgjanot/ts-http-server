
import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { NewUser, users } from "../schema.js";
import { DatabaseError } from "../../errors.js";

export async function createUser(user: NewUser) {
    try {
        const [result] = await db
            .insert(users)
            .values(user)
            .onConflictDoNothing()
            .returning();
        return result;
    } catch (err) {
        throw new DatabaseError("Failed to create user", err);
    }
}

export async function deleteUsers() {
    try {
        const [result] = await db
            .delete(users)
            .returning();
        return result;
    } catch (err) {
        throw new DatabaseError("Failed to delete users", err);
    }
}

export async function getUserbyEmail(email: string) {
    try {
        const [result] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
        return result;
    } catch (err) {
        throw new DatabaseError("Failed to retrieve user", err);
    }
    
}

export async function getUserbyId(id: string) {
    try {
        const [result] = await db
            .select()
            .from(users)
            .where(eq(users.id, id))
        return result;
    } catch (err) {
        throw new DatabaseError("Failed to retrieve user", err);
    } 
}

export async function upateUserEmail(email: string, newEmail: string) {
    try {
        const [result] = await db
            .update(users)
            .set({email: newEmail})
            .where(eq(users.email, email))
            .returning()
        return result;
    } catch (err) {
        throw new DatabaseError("Failed to retrieve user", err);
    } 
}

export async function upateUserPassword(email: string, newHashedPassword: string) {
    try {
        const [result] = await db
            .update(users)
            .set({hashedPassword: newHashedPassword})
            .where(eq(users.email, email))
            .returning()
        return result;
    } catch (err) {
        throw new DatabaseError("Failed to retrieve user", err);
    } 
}

export async function upateUser(email: string, newEmail: string, newHashedPassword: string) {
    try {
        const [result] = await db
            .update(users)
            .set({email: newEmail,hashedPassword: newHashedPassword})
            .where(eq(users.email, email))
            .returning()
        return result;
    } catch (err) {
        throw new DatabaseError("Failed to retrieve user", err);
    } 
}