import express from "express";
import { handlerReset } from "./admin/metrics/reset.js";
import { errorMiddleWare, middlewareLogging, middlewareMetricsInc } from "./api/middlewares.js";
import { handlerReadiness } from "./api/readiness.js";
import { handlerMetrics } from "./admin/metrics/metrics.js";
import { handlerChirpsValidate } from "./api/chirps.js";

const app = express();
const PORT = 8080;

app.use(middlewareLogging);
app.use(express.json());

app.use("/app", middlewareMetricsInc, express.static("./src/app"));

app.get("/api/healthz", (req, res, next) => {
  Promise.resolve(handlerReadiness(req, res)).catch(next);
});
app.get("/admin/metrics", (req, res, next) => {
  Promise.resolve(handlerMetrics(req, res)).catch(next);
});
app.post("/admin/reset", (req, res, next) => {
  Promise.resolve(handlerReset(req, res)).catch(next);
});

app.post("/api/validate_chirp", (req, res, next) => {
  Promise.resolve(handlerChirpsValidate(req, res)).catch(next);
});

app.use(errorMiddleWare);

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

