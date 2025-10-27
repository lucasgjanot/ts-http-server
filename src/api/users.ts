import { Request, Response } from "express";
import { BadRequestError } from "../errors.js";
import { respondWithJSON } from "./json.js";
import { createUser, upateUser } from "../db/query/user.js";
import { User, NewUser } from "../db/schema.js";
import { getBearerToken, hashPassword, validateJWT, validateToken } from "../auth.js";
import { LogLevel } from "../config.js";
import { log } from "../logger.js";
import { getRefreshToken } from "src/db/query/refreshtoken.js";


export type UserResponse = Omit<User, "hashedPassword">;


export function userResponse(user: User): UserResponse {
    const { id, email, createdAt, updatedAt} = user;
    return {id, email, createdAt, updatedAt};
}

export async function handlerCreateUser(req: Request, res: Response) {
    type Parameters = {
        email: string;
        password: string;
    };
    const params: Parameters = req.body;

    if (!params || !params.email || !params.password) {
        throw new BadRequestError("Missing required fields");
    }

    log(LogLevel.DEBUG, `Starting user creation with email: ${params.email}`);

    try {
        const hashedPassword = await hashPassword(params.password);
        const newUser: NewUser = { email: params.email, hashedPassword };
        const user = await createUser(newUser);

        if (!user) {
            throw new BadRequestError("User already exists");
        }

        log(LogLevel.INFO, `User successfully created: ${user.id}`);
        respondWithJSON(res, 201, userResponse(user));
    } catch (error) {
        throw error;
    }
}

export async function handlerUpdateUser(req: Request, res: Response) {
    type parameters = {
        email: string;
        password: string;
    }
    
    const params: parameters = req.body
    const user = await validateToken(req)

    if (!params || !params.email || !params.password) {
        throw new BadRequestError("Missing required fields");
    }

    const hashedPassword = await hashPassword(params.password);
    log(LogLevel.DEBUG, `Starting user update: ${user.id}`);
    const updatedUser: User = await upateUser(user.email, params.email, hashedPassword)
    if (!updatedUser) {
        throw new Error("Failed to update user")
    }
    respondWithJSON(res,200,userResponse(updatedUser));
    log(LogLevel.INFO, `User successfully updated: ${user.id}`);
}
