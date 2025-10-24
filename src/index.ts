import express from "express";
import { handlerReset } from "./admin/metrics/reset.js";
import { middlewareLogging, middlewareMetricsInc } from "./api/middlewares.js";
import { handlerReadiness } from "./api/readiness.js";
import { handlerMetrics } from "./admin/metrics/metrics.js";
import { handlerChirpsValidate } from "./api/chirps.js";

const app = express();
const PORT = 8080;

app.use(middlewareLogging);
app.use(express.json())

app.use("/app", middlewareMetricsInc, express.static("./src/app"))

app.all("/api/healthz", handlerReadiness)

app.get("/admin/metrics", handlerMetrics)

app.post("/admin/reset", handlerReset)

app.post("/api/validate_chirp", handlerChirpsValidate)

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

