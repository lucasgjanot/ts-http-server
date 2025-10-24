import { NextFunction } from "express";
import { Request, Response } from "express";
import { config } from "../config.js";

// type Middleware = (req: Request, res: Response, next: NextFunction) => void;

export function middlewareLogging(req: Request, res: Response, next: NextFunction) {
    res.on("finish", () => {
        const statusCode = res.statusCode
        if (statusCode !== 200) {
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${statusCode}`)
        }
    });
    next();
}

export function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
    config.fileServerHits++;
    next();
}
