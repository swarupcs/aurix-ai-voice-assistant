import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const prismaClientSingleton = () => {
  // Always retrieve the connection string from environment variables explicitly
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // If it's truly missing, log loudly and clearly, instead of letting Neon fail silently with "localhost" defaults.
    console.error("❌ CRITICAL: DATABASE_URL environment variable is NOT SET!");
    throw new Error("DATABASE_URL is required but not set in the environment.");
  }

  // Use the standard PrismaClient in development.
  // We provide the connection string via the constructor just to be absolutely certain it's used.
  if (process.env.NODE_ENV !== "production") {
    return new PrismaClient({
      datasources: {
        db: {
          url: connectionString,
        },
      },
    });
  }

  // In production (Vercel Node.js/Edge), explicitly configure Neon pool with the connection string
  // to prevent it from defaulting to localhost.
  const pool = new Pool({ connectionString: connectionString });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaNeon(pool as any);
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
