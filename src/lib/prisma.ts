import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createClient() {
  const adapter = new PrismaPg(
    {
      connectionString: process.env.DATABASE_URL,
      // Serverless Postgres providers (Neon included) close idle connections
      // from their end; recycling ours first avoids handing out a connection
      // the server already dropped.
      max: 5,
      idleTimeoutMillis: 10_000,
    },
    {
      // Without these, an idle connection the server closes out from under
      // the pool surfaces as an unhandled 'error' event and can crash the
      // process instead of just failing the one in-flight query.
      onPoolError: (err) => console.error("[prisma] pool error:", err.message),
      onConnectionError: (err) => console.error("[prisma] connection error:", err.message),
    }
  );
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
