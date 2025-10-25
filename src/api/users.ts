import { Request, Response } from "express";
import { BadRequestError } from "./errors.js";
import { respondWithJSON } from "./json.js";
import { createUser } from "../db/query/user.js";
import { User, NewUser } from "../db/schema.js";
import { hashPassword } from "../auth.js";


export type UserResponse = Omit<User, "hashedPassword">;

export function userResponse(user: User): UserResponse {
    const { id, email, createdAt, updatedAt} = user;
    return {id, email, createdAt, updatedAt};
}

export async function handlerCreateUser(req: Request, res: Response) {
    type parameters = {
    email: string;
    password: string
    };
    const params: parameters = req.body;

    if (!params.email || !params.password) {
        throw new BadRequestError("Missing required fields")
    }

    const hashedPassword = await hashPassword(params.password)

    const newUser: NewUser = { email: params.email, hashedPassword}
    const result = await createUser(newUser);

    if (!result) {
        throw new BadRequestError("User already exists");
    }

    respondWithJSON(res, 201, userResponse(result));
}

