import { defineConfig, env } from "prisma/config";
import { config } from "dotenv";

// Load environment variables from .env file
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
    // shadowDatabaseUrl is optional - only set if you have a separate shadow DB
  },
});
