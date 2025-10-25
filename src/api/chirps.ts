import { Request, Response } from "express";
import { respondWithJSON } from "./json.js";
import { BadRequestError, ConflictError, NotFoundError } from "./errors.js";
import { Chirp, NewChirp } from "../db/schema.js";
import { CreateChirp, getChirpById, getChirps } from "../db/query/chirp.js";

const MAX_CHIRP_LENGTH = 140;

const BAD_WORDS = [
    "kerfuffle",
    "sharbert",
    "fornax"
]

export type PublicChirp = Pick<Chirp,"id" | "body" | "userId">

export function publicChirp(chirp: Chirp) : PublicChirp {
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
    userId: string
  };

  const params: Parameters = req.body;

  if (!params.body || !params.userId) {
    throw new BadRequestError("Missing required fields")
  }

  if (params.body.length > MAX_CHIRP_LENGTH) {
    throw new BadRequestError(`Chirp is too long. Max length is ${MAX_CHIRP_LENGTH}`)
  }

  const cleaned = validateChirp(params.body);

  const newChirp: NewChirp = {body: cleaned, userId: params.userId};
  const result = await CreateChirp(newChirp);

  respondWithJSON(res, 201, publicChirp(result));
}

export async function handlerGetChirps(req: Request, res: Response) {
  const result = await getChirps();
  respondWithJSON(res, 200, result.map((chirp) => publicChirp(chirp)));
}

export async function handlerGetChirpById(req: Request, res: Response) {
  const { chirpId } = req.params;

  const chirp = await getChirpById(chirpId);
  if (!chirp) {
    throw new NotFoundError(`Chirp with chirpId: ${chirpId} not found`);
  }
  respondWithJSON(res, 200, publicChirp(chirp));
}