import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

import { NotFoundError, UserNotAuthenticatedError } from "./errors.js";
import { Request } from "express";
import { config } from "./config.js";
import { randomBytes } from "crypto";
import { getUserbyId } from "./db/query/user.js";
import { createRefreshToken, getRefreshToken, revokeRefreshToken } from "./db/query/refreshtoken.js";
import { NewRefreshTokens } from "./db/schema.js";

const TOKEN_ISSUER = config.jwt.issuer;
const SECRET = config.jwt.secret;
const JWT_DURATION = config.jwt.duration;
const REFRESH_DURATION_DAYS = config.refreshToken.duration;
const MS_PER_DAY = 24 * 60 * 60 * 1000;


type Payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export async function hashPassword(password: string) {
    return await argon2.hash(password);
}

export async function checkPasswordHash(password: string, hashed: string) {
    if (!password) return false;
    try {
        return await argon2.verify(hashed, password);
    } catch {
        return false;
    }
}

export function makeJWT(userId: string, secret: string = SECRET): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const payload: Payload = {
        iss: TOKEN_ISSUER,
        sub: userId,
        iat: issuedAt,
        exp: issuedAt + JWT_DURATION
    };
    const token = jwt.sign(payload, secret, { algorithm: "HS256" })
    return token;
}

export function validateJWT(tokenString: string, secret: string = SECRET) {
  let decoded: Payload;
  try {
    decoded = jwt.verify(tokenString, secret) as JwtPayload;
  } catch (e) {
    throw new UserNotAuthenticatedError("Invalid token");
  }

  if (decoded.iss !== TOKEN_ISSUER) {
    throw new UserNotAuthenticatedError("Invalid issuer");
  }

  if (!decoded.sub) {
    throw new UserNotAuthenticatedError("No user ID in token");
  }

  return decoded.sub;
}

export function getBearerToken(req: Request): string {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
        throw new UserNotAuthenticatedError("Missing Authorization header");
    }
    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) {
    throw new UserNotAuthenticatedError("Invalid Bearer token format");
    }
    return token;  
}

export function getAPIKey(req: Request): string {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
        throw new UserNotAuthenticatedError("Missing Authorization header");
    }
    const [type, token] = authHeader.split(" ");
    if (type !== "ApiKey" || !token) {
    throw new UserNotAuthenticatedError("Invalid ApiKey token format");
    }
    return token;  
}

export function makeRefreshToken() {
  return randomBytes(32).toString('hex')
}


export async function validateToken(req: Request) {
  try {
    const jwtToken = getBearerToken(req);
    const userId = validateJWT(jwtToken);
    const user = await getUserbyId(userId);
    if (!user) throw new NotFoundError("User not found");
    return user;
  } catch (err) {
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) throw new UserNotAuthenticatedError("No refresh token provided");
    const stored = await getRefreshToken(refreshToken);
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UserNotAuthenticatedError("Invalid or expired refresh token");
    }
    const user = await getUserbyId(stored.userId);
    if (!user) throw new NotFoundError("User not found");
    return user;
  }
}

export async function renewTokens(refreshTokenString: string) {
  const stored = await getRefreshToken(refreshTokenString);
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new UserNotAuthenticatedError("Invalid refresh token");
  }
  const user = await getUserbyId(stored.userId);
  if (!user) throw new NotFoundError("User not found");

  const newJwt = makeJWT(user.id)
  const newRefreshToken = makeRefreshToken();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + REFRESH_DURATION_DAYS * MS_PER_DAY)

  // Salvar novo refresh token e revogar o antigo
  await revokeRefreshToken(stored.token);

  await createRefreshToken({token: newRefreshToken, userId: user.id, createdAt, expiresAt } satisfies NewRefreshTokens);

  return { token: newJwt, refreshToken: newRefreshToken };
}

export async function handleLoginSuccess(userId: string) {
  const token = makeJWT(userId);
  const refreshToken = await makeRefreshToken();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + REFRESH_DURATION_DAYS * MS_PER_DAY);

  await createRefreshToken({
    userId,
    token: refreshToken,
    createdAt,
    expiresAt,
  });

  return { token, refreshToken };
}

