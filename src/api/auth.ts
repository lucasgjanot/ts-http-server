import { Request, Response } from "express";
import { BadRequestError, UserNotAuthenticatedError } from "../errors.js";
import { NewRefreshTokens, User } from "../db/schema.js";
import { getUserbyEmail } from "../db/query/user.js";
import { UserResponse, userResponse } from "./users.js";
import { respondWithJSON } from "./json.js";
import { checkPasswordHash, getBearerToken, handleLoginSuccess, makeJWT, makeRefreshToken } from "../auth.js";
import { createRefreshToken, revokeRefreshToken, userForRefreshToken } from "../db/query/refreshtoken.js";
import { config } from "../config.js";
import { log } from "../logger.js";
import { LogLevel } from "../config.js";
import { ConsoleLogWriter } from "drizzle-orm";


type TokenResponse = {
    token: string;
    refreshToken: string;
}
type LoginResponse = UserResponse & TokenResponse;


export async function handlerLogin(req: Request, res: Response) {
    const params = req.body as { email: string; password: string };

    log(LogLevel.DEBUG, `Login attempt for email: ${params?.email}`);

    if (!params || !params.email || !params.password) {
        throw new BadRequestError("missing required fields");
    }

    const user: User = await getUserbyEmail(params.email);
    if (!user) {
        throw new UserNotAuthenticatedError("invalid username or password");
    }

    const validPassword = await checkPasswordHash(params.password, user.hashedPassword);
    if (!validPassword) {
        throw new UserNotAuthenticatedError("invalid username or password");
    }

    const { token, refreshToken } = await handleLoginSuccess(user.id);

    const response: LoginResponse = {
        ...userResponse(user),
        token,
        refreshToken
    };

    log(LogLevel.INFO, `User logged in successfully: ${user.id}`);
    respondWithJSON(res, 200, response);
}

export async function handlerRefresh(req: Request, res: Response) {
    const refreshToken = getBearerToken(req);
    log(LogLevel.DEBUG, `Refresh token attempt`);

    const result = await userForRefreshToken(refreshToken);
    if (!result) throw new UserNotAuthenticatedError("invalid token")
    const user = result.user;
    const revoked = revokeRefreshToken(refreshToken)

    const { token: newJwt, refreshToken: newRefreshToken } = await handleLoginSuccess(user.id);



    log(LogLevel.INFO, `Refresh token successful for user: ${user.id}`);
    respondWithJSON(res, 200, { token: newJwt, refreshToken: newRefreshToken } satisfies TokenResponse);
}

export async function handlerRevoke(req: Request, res: Response) {
    const refreshToken = getBearerToken(req);
    log(LogLevel.DEBUG, `Revoking refresh token`);

    await revokeRefreshToken(refreshToken);

    log(LogLevel.INFO, `Refresh token revoked successfully`);
    res.status(204).send();
}
