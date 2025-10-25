import { NextFunction } from "express";
import { Request, Response } from "express";
import { config } from "../config.js";
import { respondWithError } from "./json.js";
import { HttpError } from "./errors.js";

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

export function middlewareMetricsInc(_: Request, __: Response, next: NextFunction) {
    config.api.fileServerHits++;
    next();
}

export function errorMiddleWare(
    err: Error,
    _: Request,
    res: Response,
    __: NextFunction,
) {
    if (err instanceof HttpError) {
        respondWithError(res, err.status, err.message);
        return;
    } 

    let statusCode = 500;
    let message = "Something went wrong on our end";

    console.log(`ERRO: ${err.message}`);

    respondWithError(res, statusCode, message);
}