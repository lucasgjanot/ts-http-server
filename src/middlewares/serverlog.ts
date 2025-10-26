import { Request, Response, NextFunction } from "express";
import { log } from "../logger.js";
import { LogLevel } from "../config.js";

export function serverOutMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    // Skip logging 4xx/5xx here — they are handled by error middleware
    if (res.statusCode >= 400) return;

    const message = `${req.method} ${req.originalUrl} - ${res.statusCode} (${durationMs.toFixed(2)} ms)`;
    log(LogLevel.INFO, message);
  });

  next();
}
