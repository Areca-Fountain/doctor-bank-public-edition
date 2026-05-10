import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  console.log("-----------------------------------------");
  console.log("DB Connection Attempt...");
  console.log("DATABASE_URL status:", process.env.DATABASE_URL ? "✅ FOUND" : "❌ MISSING");
  console.log("-----------------------------------------");

  // In Prisma v6, this works perfectly without any adapters!
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;