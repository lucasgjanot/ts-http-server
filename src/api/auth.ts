import { Request, Response } from "express";
import { BadRequestError, UserNotAuthenticatedError } from "../errors.js";
import { NewRefreshTokens, RefreshTokens, User } from "../db/schema.js";
import { getUserbyEmail } from "../db/query/user.js";
import { UserResponse, userResponse } from "./users.js";
import { respondWithJSON } from "./json.js";
import { checkPasswordHash, getBearerToken, makeJWT, makeRefreshToken, validateJWT } from "../auth.js";
import { createRefreshToken, getRefreshToken, revokeRefreshToken, userForRefreshToken } from "../db/query/refreshtoken.js";
import { config } from "../config.js";


const MS_PER_DAY = 24 * 60 * 60 * 1000;

type LoginResponse = UserResponse & {
  token: string;
  refreshToken: string
};

export async function handlerLogin(req: Request, res: Response) {
    type parameters = {
        email: string,
        password: string
    };

    const params: parameters = req.body;

    if (!params || !params.email || !params.password) {
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

    const token = makeJWT(user.id);
    const refreshToken = makeRefreshToken();
    
    const response: LoginResponse = {
        ...userResponse(user),
        token,
        refreshToken
    };
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + config.refreshToken.duration * MS_PER_DAY)
    const result = await createRefreshToken({
        userId: user.id,
        token: refreshToken,
        createdAt,
        expiresAt

    } satisfies NewRefreshTokens)
    if (!result) {
        throw Error("Refresh token collision — failed to create unique token");
    }
    respondWithJSON(res, 200, response);
}

export async function handlerRefresh(req: Request, res: Response) {
  let refreshToken = getBearerToken(req);

  const result = await userForRefreshToken(refreshToken);
  if (!result) {
    throw new UserNotAuthenticatedError("invalid refresh token");
  }

  const user = result.user;
  const accessToken = makeJWT(user.id);

  type response = {
    token: string;
  };

  respondWithJSON(res, 200, {
    token: accessToken,
  } satisfies response);
}

export async function handlerRevoke(req: Request, res: Response) {
  const refreshToken = getBearerToken(req);
  await revokeRefreshToken(refreshToken);
  res.status(204).send();
}
