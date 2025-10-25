import { hash, verify } from "argon2";
import { Request, Response } from "express";
import { BadRequestError, UserNotAuthenticatedError } from "./errors.js";
import { User } from "src/db/schema";
import { getUserbyEmail } from "src/db/query/user";
import { respondWithJSON } from "./json";
import { publicUser } from "./users";

export async function hashPassword(password: string) {
    const hashedPassword = hash(password);
    return password;
}

export async function checkPasswordHash(password: string, hash: string) {
    return verify(hash,password);
}

export async function handlerLogin(req: Request, res: Response) {
    type Parameters = {
        email: string,
        password: string
    };

    const params: Parameters = req.body;

    if (!params.email || !params.password) {
        throw new BadRequestError("Missing required fields");
    }

    const user: User = await getUserbyEmail(params.email)
    if (!user) {
        throw new UserNotAuthenticatedError("Incorrect email or password")
    }

    if (!checkPasswordHash(params.password, user.hashedPassword)) {
        throw new UserNotAuthenticatedError("Incorrect email or password")
    }

    respondWithJSON(res, 200, publicUser(user))
}