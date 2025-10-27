import { Request, Response } from "express";
import { respondWithJSON } from "./json.js";
import { BadRequestError, NotFoundError } from "../errors.js";
import { Chirp, NewChirp, User } from "../db/schema.js";
import { createChirp, getChirpById, getChirps } from "../db/query/chirp.js";
import { getUserbyId } from "../db/query/user.js";
import { getBearerToken, validateJWT } from "../auth.js";
import { log } from "../logger.js";
import { LogLevel } from "../config.js";

const MAX_CHIRP_LENGTH = 140;
const BAD_WORDS = ["kerfuffle", "sharbert", "fornax"];

export type ChirpResponse = Pick<Chirp, "id" | "body" | "userId">;

export function chirpResponse(chirp: Chirp): ChirpResponse {
  const { id, body, userId } = chirp;
  return { id, body, userId };
}

function validateChirp(body: string) {
  if (body.length > MAX_CHIRP_LENGTH) {
    throw new BadRequestError(`Chirp is too long. Max length is ${MAX_CHIRP_LENGTH}`);
  }
  return getCleanedBody(body, BAD_WORDS);
}

function getCleanedBody(body: string, badWords: string[]) {
  const words = body.split(" ");
  for (let i = 0; i < words.length; i++) {
    if (badWords.includes(words[i].toLowerCase())) {
      words[i] = "****";
    }
  }
  return words.join(" ");
}

export async function handlerCreateChirps(req: Request, res: Response) {
  const params = req.body as { body: string };
  const token = getBearerToken(req);
  const userId = validateJWT(token);

  log(LogLevel.INFO, `User ${userId} is attempting to create a chirp`);

  if (!params?.body) {
    throw new BadRequestError("missing required fields");
  }

  const user: User = await getUserbyId(userId);
  if (!user) {
    throw new NotFoundError(`User with id ${userId} not found`);
  }

  const cleaned = validateChirp(params.body);
  const newChirp: NewChirp = { body: cleaned, userId };
  const result = await createChirp(newChirp);

  log(LogLevel.INFO, `User ${userId} created a chirp with id ${result.id}`);
  respondWithJSON(res, 201, chirpResponse(result));
}

export async function handlerGetChirps(req: Request, res: Response) {
  log(LogLevel.INFO, `Fetching all chirps`);
  const result = await getChirps();
  respondWithJSON(res, 200, result.map(chirpResponse));
}

export async function handlerGetChirpById(req: Request, res: Response) {
  const { chirpId } = req.params;
  log(LogLevel.INFO, `Fetching chirp with id ${chirpId}`);
  const chirp = await getChirpById(chirpId);

  if (!chirp) {
    throw new NotFoundError(`Chirp with chirpId: ${chirpId} not found`);
  }

  respondWithJSON(res, 200, chirpResponse(chirp));
}
