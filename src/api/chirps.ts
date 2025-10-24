import { Request, Response } from "express";
import { respondWithError, respondWithJSON } from "./json.js";

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
    respondWithError(res, 400, "Chirp is too long");
    return;
  }

  const cleanedBody = ""
  const parts = params.body
  .split(" ")
  .map((word) => (BAD_WORDS.includes(word) ? "****" : word));

  respondWithJSON(res, 200, {
    cleanedBody: parts
  });
}