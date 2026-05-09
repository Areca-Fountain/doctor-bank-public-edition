import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Hardcoding the URL just to get the push to work!
    url: "postgresql://neondb_owner:npg_jgBict69uMPs@ep-plain-sun-anjaxy3f.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  },
});