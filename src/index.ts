import express, { NextFunction } from "express";
import { Request, Response } from "express";
import { config } from "./config.js";

const app = express();
const port = 8080;

app.use(middlewareLogging);
app.use("/app", middlewareMetricsInc, express.static("./src/app"))
app.all("/healthz", handlerReadiness)

app.get("/metrics", (req: Request, res: Response) => {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(`Hits: ${config.fileserverHits}`)
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

function handlerReadiness(req: Request, res: Response) {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send("OK");
}

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

function middlewareLogging(req: Request, res: Response, next: NextFunction) {
    res.on("finish", () => {
        const statusCode = res.statusCode
        if (statusCode !== 200) {
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${statusCode}`)
        }
    });
    next();
}

function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
    config.fileserverHits++;
    next();
}