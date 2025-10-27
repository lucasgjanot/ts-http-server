import express from "express";
import { handlerReset } from "./admin/metrics/reset.js";
import { handlerReadiness } from "./api/readiness.js";
import { handlerMetrics } from "./admin/metrics/metrics.js";
import { config, LogLevel } from "./config.js";
import { handlerCreateUser, handlerUpdateUser } from "./api/users.js";
import { handlerLogin, handlerRefresh, handlerRevoke } from "./api/auth.js";
import { accessLogMiddleware } from "./middlewares/acceslog.js";
import { middlewareMetricsInc } from "./middlewares/metrics.js";
import { errorLogMiddleware } from "./middlewares/errorlog.js";
import { handlerCreateChirps, handlerGetChirpById, handlerGetChirps } from "./api/chirps.js";
import { log } from "./logger.js";

const app = express();
const PORT = config.api.port;


app.use(express.json());
app.use(accessLogMiddleware);


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
app.put("/api/users", (req, res, next) => {
  Promise.resolve(handlerUpdateUser(req, res)).catch(next);
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

app.post("/api/refresh", (req, res, next) => {
  Promise.resolve(handlerRefresh(req, res).catch(next))
})

app.post("/api/revoke", (req, res, next) => {
  Promise.resolve(handlerRevoke(req, res).catch(next))
})

app.use(errorLogMiddleware);

app.listen(PORT, () => {
    log(LogLevel.INFO, `Server is running at http://localhost:${PORT}`);
});

