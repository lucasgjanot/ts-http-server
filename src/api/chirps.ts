import { Request, Response } from "express";
import { respondWithError, respondWithJSON } from "./json.js";
import { BadRequestError } from "./errors.js";

const MAX_CHIRP_LENGTH = 140;

const BAD_WORDS = [
    "kerfuffle",
    "sharbert",
    "fornax"
]

export async function handlerChirpsValidate(req: Request, res: Response) {
  type parameters = {
    body: string;
  };

  const params: parameters = req.body;

  if (params.body.length > MAX_CHIRP_LENGTH) {
    throw new BadRequestError(`Chirp is too long. Max length is ${MAX_CHIRP_LENGTH}`)
  }

  const parts = params.body
  .split(" ")
  .map((word) => (BAD_WORDS.includes(word.toLocaleLowerCase()) ? "****" : word));
  const cleanedBody = parts.join(" ")
  respondWithJSON(res, 200, {
    cleanedBody
  });
}