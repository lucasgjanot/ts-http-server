import { Request, Response, NextFunction } from "express";
import { log } from "../logger.js";
import { LogLevel } from "../config.js";
import { DatabaseError, HttpError } from "../errors.js";


export function errorLogMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof HttpError) {
    // Respond with the correct HTTP status
    res.status(err.status).json({ message: err.message });
    log(LogLevel.WARN, `HTTP Error ${err.status}: ${err.message}`);
    return;
  }

  if (err instanceof DatabaseError) {
    // Respond with the correct HTTP status
    res.status(500).json({ message: "Internal server error" });
    log(LogLevel.ERROR, `DatabaseError: ${err.message}`);
    return;
  }

  res.status(500).json({ message: "Internal server error" });
  log(LogLevel.ERROR, `Unhandled Error: ${err.message}`, err);
}