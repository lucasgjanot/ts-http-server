import { Request, Response } from "express";
import { config } from "../../config.js";
import fs from "fs";
import path from "path";

export function handlerMetrics(req: Request, res: Response) {
    const filePath = path.join(process.cwd(), "src/admin/metrics/index.html");
    let html = fs.readFileSync(filePath, "utf-8");
    
    html = html.replace("NUM", config.fileServerHits.toString())

    res.set("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
}