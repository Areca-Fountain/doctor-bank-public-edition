import { config } from "dotenv";
import { defineConfig } from "@prisma/config";

// Load secrets from .env.local (this file is gitignored). Never hardcode the database URL here.
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});