import { Request, Response } from "express";
import { respondWithJSON } from "./json.js";
import { BadRequestError, NotFoundError} from "./errors.js";
import { Chirp, NewChirp, User } from "../db/schema.js";
import { createChirp, getChirpById, getChirps } from "../db/query/chirp.js";
import { getUserbyId } from "../db/query/user.js"
import { getBearerToken, validateJWT } from "../auth.js";


const MAX_CHIRP_LENGTH = 140;

const BAD_WORDS = [
    "kerfuffle",
    "sharbert",
    "fornax"
]

export type ChirpResponse = Pick<Chirp,"id" | "body" | "userId">

export function chirpResponse(chirp: Chirp) : ChirpResponse {
  const {id, body, userId} = chirp;
  return {id, body, userId};
}

function validateChirp(body: string) {
  const maxChirpLength = 140;
  if (body.length > maxChirpLength) {
    throw new BadRequestError(
      `Chirp is too long. Max length is ${maxChirpLength}`,
    );
  }

  const badWords = ["kerfuffle", "sharbert", "fornax"];
  return getCleanedBody(body, badWords);
}

function getCleanedBody(body: string, badWords: string[]) {
  const words = body.split(" ");

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const loweredWord = word.toLowerCase();
    if (badWords.includes(loweredWord)) {
      words[i] = "****";
    }
  }

  const cleaned = words.join(" ");
  return cleaned;
}

export async function handlerCreateChirps(req: Request, res: Response) {
  type Parameters = {
    body: string;
  };

  const params: Parameters = req.body;
  const token = getBearerToken(req);
  const userId = validateJWT(token);

  if (!params.body) {
    throw new BadRequestError("missing required fields")
  }

  const user: User = await getUserbyId(userId);
  if (!user) {
    throw new NotFoundError(`User with id ${userId} not found`);
  }

  if (params.body.length > MAX_CHIRP_LENGTH) {
    throw new BadRequestError(`Chirp is too long. Max length is ${MAX_CHIRP_LENGTH}`)
  }

  const cleaned = validateChirp(params.body);

  const newChirp: NewChirp = {body: cleaned, userId: userId};
  const result = await createChirp(newChirp);

  respondWithJSON(res, 201, chirpResponse(result));
}

export async function handlerGetChirps(req: Request, res: Response) {
  const result = await getChirps();
  respondWithJSON(res, 200, result.map((chirp) => chirpResponse(chirp)));
}

export async function handlerGetChirpById(req: Request, res: Response) {
  const { chirpId} = req.params;
  const chirp = await getChirpById(chirpId);

  if (!chirp) {
    throw new NotFoundError(`Chirp with chirpId: ${chirpId} not found`);
  }

  respondWithJSON(res, 200, chirpResponse(chirp));
}