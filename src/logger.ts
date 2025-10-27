import fs from "fs";
import path from "path";
import { config, LogLevel } from "./config.js";

/**
 * Converts log level to a numeric priority
 * Higher number = more verbose
 */
function getLogPriority(level: LogLevel): number {
  switch (level) {
    case LogLevel.INIT: return -1;
    case LogLevel.ERROR: return 0;
    case LogLevel.WARN:  return 1;
    case LogLevel.INFO:  return 2;
    case LogLevel.DEBUG: return 3;
    default: return 2;
  }
}

/**
 * Ensures that a file and its directories exist
 */
function ensureFile(filePath: string) {
  const absPath = path.resolve(process.cwd(), filePath);
  const dir = path.dirname(absPath);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(absPath)) {
      fs.writeFileSync(absPath, "");
    }
  } catch (err) {
    console.error(`Failed to ensure file ${absPath}:`, err);
  }
  return absPath;
}

/**
 * Writes to a file synchronously
 */
function writeFile(filePath: string, entry: string) {
  try {
    const absPath = ensureFile(filePath);
    fs.appendFileSync(absPath, entry + "\n");
  } catch (err) {
    console.error("Failed to write log file:", err);
  }
}

/**
 * Main log function (respects configured log level)
 */
export function log(level: LogLevel, message: string, meta?: any) {
  const configuredLevel = config.logLevel;
  
  // Skip logs below the configured level
  if (getLogPriority(level) > getLogPriority(configuredLevel)) {
    return;
  }

  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message} ${meta ? JSON.stringify(meta) : ""}`;

  // Console output
  if (level === LogLevel.ERROR) {
    console.error(logMessage);
  } else if (level === LogLevel.WARN) {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }

  // File logs
  if (level === LogLevel.ERROR) {
    writeFile(config.logPaths.serverErr, logMessage);
  }
  writeFile(config.logPaths.serverOut, logMessage);
}

/**
 * Access log (for HTTP requests)
 */
export function writeAccessLog(entry: string) {
  writeFile(config.logPaths.accessLog, entry);
}
