// src/logger.ts
import fs from "fs";
import path from "path";
import { config, LogLevel } from "./config.js";

/**
 * Garante que o arquivo existe, criando diretório e arquivo se necessário
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
 * Escreve no arquivo de forma síncrona
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
 * Função principal de log
 */
export function log(level: LogLevel, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message} ${meta?meta:""}`;

  // Console
  console[level === LogLevel.ERROR ? "error" : "log"](logMessage);
    
  // Arquivos
  if (level === LogLevel.ERROR) {
    writeFile(config.logPaths.serverErr, logMessage);
  }
  writeFile(config.logPaths.serverOut, logMessage);
}

/**
 * Log de acesso HTTP
 */
export function writeAccessLog(entry: string) {
  writeFile(config.logPaths.accessLog, entry);
}
