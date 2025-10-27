import type { MigrationConfig } from "drizzle-orm/migrator";

export enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
}


type Config = {
  api: APIConfig;
  db: DBConfig,
  jwt: JWTConfig;
  refreshToken: RefreshTokensConfig;
  logLevel: LogLevel;
  logPaths: LogPaths
}

type APIConfig = {
    fileServerHits: number;
    port: number;
    platform: string,
}

type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
}

type JWTConfig = {
  duration: number;
  secret: string;
  issuer: string;
};

type RefreshTokensConfig = {
  duration: number;
};

type LogPaths = {
  accessLog: string; 
  serverOut: string;
  serverErr: string;
}

process.loadEnvFile();

function envOrThrow(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

function envOrDefault(key: string, defaultValue: string) {
  return process.env[key] || defaultValue;
}

function parseLogLevel(value: string): LogLevel {
    if (Object.values(LogLevel).includes(value as LogLevel)) {
        return value as LogLevel;
    }
    throw new Error(`LOG_LEVEL inválido: ${value}`);
}

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/migrations",
};

export const config: Config = {
  api: {
    fileServerHits: 0,
    port: Number(envOrDefault("PORT", "8080")),
    platform: envOrThrow("PLATFORM"),
  },
  db: {
    url: envOrThrow("DB_URL"),
    migrationConfig: migrationConfig,
  },
  jwt: {
    duration: Number(envOrDefault("JWT_DURATION", "600")),
    secret: envOrThrow("JWT_SECRET"),
    issuer: "chirpy",
  },
  refreshToken: {
    duration: Number(envOrDefault("REFRESH_TOKEN_DURATION", "60"))
  },
  logLevel: parseLogLevel(envOrDefault("LOG_LEVEL", "INFO")),
  logPaths: {
    accessLog: envOrDefault("ACCESS_LOG_PATH", "log/chirpy/access.log"),
    serverOut: envOrDefault("SERVER_OUT_PATH", "log/chirpy/server.out"),
    serverErr: envOrDefault("SERVER_ERR_PATH", "log/chirpy/server.err")
  }
  
};
