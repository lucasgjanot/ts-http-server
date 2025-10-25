import { Request, Response } from "express";
import { BadRequestError, UserNotAuthenticatedError } from "./errors.js";
import { User } from "../db/schema.js";
import { getUserbyEmail } from "../db/query/user.js";
import { UserResponse, userResponse } from "./users.js";
import { respondWithJSON } from "./json.js";
import { checkPasswordHash, makeJWT } from "../auth.js";
import { config } from "../config.js";

const JWT_DEFAULT_DURATION = config.jwt.defaultDuration;

type LoginResponse = UserResponse & {
  token: string;
};

export async function handlerLogin(req: Request, res: Response) {
    type Parameters = {
        email: string,
        password: string,
        expiresIn?: number
    };

    const params: Parameters = req.body;

    if (!params.email || !params.password) {
        throw new BadRequestError("missing required fields");
    }

    const user: User = await getUserbyEmail(params.email);
    if (!user) {
        throw new UserNotAuthenticatedError("invalid username or password");
    }
    const validPassword = await checkPasswordHash(params.password, user.hashedPassword)
    if (!validPassword) {
        throw new UserNotAuthenticatedError("invalid username or password");
    }

    const duration = params.expiresIn && params.expiresIn <= JWT_DEFAULT_DURATION 
        ? params.expiresIn
        : 600;

    const token = makeJWT(user.id, duration);
    
    const response: LoginResponse = {
        ...userResponse(user),
        token
    };
    respondWithJSON(res, 200, response);
}