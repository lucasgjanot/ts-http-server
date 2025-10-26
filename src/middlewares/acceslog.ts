import { Request, Response, NextFunction } from "express";
import { writeAccessLog } from "../logger.js";



export function accessLogMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const entry = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    writeAccessLog(entry);
  });

  next();
}
