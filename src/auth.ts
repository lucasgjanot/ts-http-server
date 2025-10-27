import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

import { BadRequestError, NotFoundError, UserNotAuthenticatedError } from "./errors.js";
import { Request } from "express";
import { config } from "./config.js";
import { randomBytes } from "crypto";
import { getUserbyId } from "./db/query/user.js";
import { getRefreshToken } from "./db/query/refreshtoken.js";

const TOKEN_ISSUER = config.jwt.issuer;
const SECRET = config.jwt.secret;
const JWT_DURATION = config.jwt.duration;


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
        throw new UserNotAuthenticatedError("Invalid Token")
    }
    const token = extractBearerToken(authHeader);
    return token;
}

export function extractBearerToken(header: string) {
  const splitAuth = header.split(" ");
  if (splitAuth.length < 2 || splitAuth[0] !== "Bearer") {
    throw new UserNotAuthenticatedError("Invalid Token")
  }
  return splitAuth[1];
}

export function makeRefreshToken() {
  return randomBytes(32).toString('hex')
}


export async function validateToken(req: Request) {
  const token = getBearerToken(req);
  try {
    const info = validateJWT(token);
    const user = await getUserbyId(info);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  } catch (err) {
    const info = await getRefreshToken(token);
    if (!info || info.revokedAt || info.expiresAt < new Date()) {
      throw new UserNotAuthenticatedError("Invalid Token")
    }
    const user = await getUserbyId(info.userId);
    return user;
  }

}