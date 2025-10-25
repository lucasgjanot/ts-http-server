import express from "express";
import { handlerReset } from "./admin/metrics/reset.js";
import { errorMiddleWare, middlewareLogging, middlewareMetricsInc } from "./api/middlewares.js";
import { handlerReadiness } from "./api/readiness.js";
import { handlerMetrics } from "./admin/metrics/metrics.js";
import { handlerCreateChirps, handlerGetChirpById, handlerGetChirps } from "./api/chirps.js";
import { config } from "./config.js";
import { handlerCreateUser } from "./api/users.js";
import { handlerLogin } from "./api/auth.js";

const app = express();
const PORT = config.api.port;

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

app.post("/api/users", (req, res, next) => {
  Promise.resolve(handlerCreateUser(req, res)).catch(next);
})

app.post("/api/login", (req, res, next) => {
  Promise.resolve(handlerLogin(req, res)).catch(next);
})

app.get("/api/chirps", (req, res, next) => {
  Promise.resolve(handlerGetChirps(req, res)).catch(next);
});

app.get("/api/chirps/:chirpId", (req, res, next) => {
  Promise.resolve(handlerGetChirpById(req, res)).catch(next);
});

app.post("/api/chirps", (req, res, next) => {
  Promise.resolve(handlerCreateChirps(req, res)).catch(next);
});

app.use(errorMiddleWare);

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

