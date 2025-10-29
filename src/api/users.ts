import { Request, Response } from "express";
import { BadRequestError, NotFoundError } from "../errors.js";
import { respondWithJSON } from "./json.js";
import { createUser, getUserbyId, getUsers, upateUser } from "../db/query/user.js";
import { User, NewUser } from "../db/schema.js";
import { hashPassword, validateToken } from "../auth.js";
import { LogLevel } from "../config.js";
import { log } from "../logger.js";



export type UserResponse = Omit<User, "hashedPassword">;


export function userResponse(user: User): UserResponse {
    const { id, email, createdAt, updatedAt, isChirpyRed} = user;
    return {id, email, createdAt, updatedAt, isChirpyRed};
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
        throw new Error(`Failed to update user: ${user.id}`)
    }
    respondWithJSON(res,200,userResponse(updatedUser));
    log(LogLevel.INFO, `User successfully updated: ${user.id}`);
}

export async function handlerGetUsers(req: Request, res: Response) {
    const users = await getUsers();
    respondWithJSON(res,200,users.map((user) => userResponse(user))) 
}

export async function handlerGetUser(req: Request, res: Response) {
    const { userId } = req.params; 
    const user = await getUserbyId(userId);
    if (!user) throw new NotFoundError("User not found");
    respondWithJSON(res,200, userResponse(user));
}