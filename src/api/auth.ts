import { Request, Response } from "express";
import { BadRequestError, UserNotAuthenticatedError } from "../errors.js";
import { NewRefreshTokens, User } from "../db/schema.js";
import { getUserbyEmail } from "../db/query/user.js";
import { UserResponse, userResponse } from "./users.js";
import { respondWithJSON } from "./json.js";
import { checkPasswordHash, getBearerToken, makeJWT, makeRefreshToken } from "../auth.js";
import { createRefreshToken, revokeRefreshToken, userForRefreshToken } from "../db/query/refreshtoken.js";
import { config } from "../config.js";
import { log } from "../logger.js";
import { LogLevel } from "../config.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type LoginResponse = UserResponse & {
  token: string;
  refreshToken: string;
};

export async function handlerLogin(req: Request, res: Response) {
    const params = req.body as { email: string; password: string };

    log(LogLevel.INFO, `Login attempt for email: ${params?.email}`);

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

    const token = makeJWT(user.id);
    const refreshToken = makeRefreshToken();

    const response: LoginResponse = {
        ...userResponse(user),
        token,
        refreshToken
    };

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + config.refreshToken.duration * MS_PER_DAY);

    const result = await createRefreshToken({
        userId: user.id,
        token: refreshToken,
        createdAt,
        expiresAt
    } satisfies NewRefreshTokens);

    log(LogLevel.INFO, `User logged in successfully: ${user.id}`);
    respondWithJSON(res, 200, response);
}

export async function handlerRefresh(req: Request, res: Response) {
    const refreshToken = getBearerToken(req);
    log(LogLevel.INFO, `Refresh token attempt`);

    const result = await userForRefreshToken(refreshToken);
    const user = result.user;
    const accessToken = makeJWT(user.id);

    log(LogLevel.INFO, `Refresh token successful for user: ${user.id}`);
    respondWithJSON(res, 200, { token: accessToken });
}

export async function handlerRevoke(req: Request, res: Response) {
    const refreshToken = getBearerToken(req);
    log(LogLevel.INFO, `Revoking refresh token`);

    await revokeRefreshToken(refreshToken);

    log(LogLevel.INFO, `Refresh token revoked successfully`);
    res.status(204).send();
}
