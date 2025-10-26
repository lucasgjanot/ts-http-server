import fs from "fs";
import path from "path";
import { config, LogLevel } from "./config.js";


// Ensure log directories exist
for (const p of Object.values(config.logPaths)) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath: string, entry: string) {
  fs.appendFile(filePath, entry + "\n", (err) => {
    if (err) console.error("Failed to write log file:", err);
  });
}

export function log(level: LogLevel, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;

  // Console
  if (meta) console[level === LogLevel.ERROR ? "error" : "log"](logMessage, meta);
  else console[level === LogLevel.ERROR ? "error" : "log"](logMessage);

  // Files
  if (level === LogLevel.ERROR) {
    const fileEntry = meta ? `${logMessage} ${JSON.stringify(meta)}` : logMessage;
    writeFile(config.logPaths.serverErr, fileEntry);
  }

  writeFile(config.logPaths.serverOut, logMessage);
}

export function writeAccessLog(entry: string) {
  writeFile(config.logPaths.accessLog, entry);
}
