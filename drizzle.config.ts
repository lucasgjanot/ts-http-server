import { defineConfig } from "drizzle-kit";
import { config } from "./src/config.js";


export default defineConfig({
  schema: "src/lib/db/schema.ts",
  out: "src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: config.dbURL
  },
});