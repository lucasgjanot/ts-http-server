import { Request, Response } from "express";
import { respondWithJSON } from "./json.js";
import { BadRequestError, NotFoundError, UserForbiddenError } from "../errors.js";
import { Chirp, NewChirp, User } from "../db/schema.js";
import { createChirp, deleteChirp, getChirpById, getChirps} from "../db/query/chirp.js";
import { getUserbyId } from "../db/query/user.js";
import { getBearerToken, validateJWT, validateToken } from "../auth.js";
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
  type parameters = {
    body: string
  }
  const params: parameters = req.body
  const token = getBearerToken(req);
  const userId = validateJWT(token);

  log(LogLevel.DEBUG, `User ${userId} is attempting to create a chirp`);

  if (!params || !params.body) {
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
  const chirps = await getChirps();
  let authorId = "";
  let authorIdQuery = req.query.authorId;
  if (typeof authorIdQuery === "string") {
    authorId = authorIdQuery;
  }

  const filteredChirps = chirps.filter(
    (chirp) => chirp.userId === authorId || authorId === ""
  )
    
  respondWithJSON(res,200, filteredChirps);
}

export async function handlerGetChirpById(req: Request, res: Response) {
  const { chirpId } = req.params;
  log(LogLevel.DEBUG, `Fetching chirp with id ${chirpId}`);
  const chirp = await getChirpById(chirpId);

  if (!chirp) {
    throw new NotFoundError(`Chirp with chirpId: ${chirpId} not found`);
  }

  respondWithJSON(res, 200, chirpResponse(chirp));
}

export async function handlerDeleteChirp(req: Request, res: Response) {
  const user = await validateToken(req);
  const {chirpId} = req.params;
  const chirp = await getChirpById(chirpId);
  if (!chirp) {
    throw new NotFoundError(`Chirp with chirpId: ${chirpId} not found`);
  }
  if (user.id != chirp.userId) {
    throw new UserForbiddenError("This user can't do this");
  }
  log(LogLevel.DEBUG, `Atempt to delete chirp with id ${chirp.id}`);
  const result = await deleteChirp(chirp.id);
  if (!result) {
    throw new Error(`Failed to delete chirp: ${chirp.id}`);
  }
  log(LogLevel.INFO, `Success on deleting chirp: ${result.id}`);

  res.status(204).send();

}