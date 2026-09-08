import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { SUPABASE_CA_CERT } from "@/lib/supabase-ca";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL;
const hostname = databaseUrl ? new URL(databaseUrl).hostname : "";

function resolveSsl(): { ca: string } | undefined {
  if (hostname === "localhost" || hostname === "127.0.0.1") return undefined;

  // Other hosted providers (e.g. Neon) use publicly-trusted certs, so they
  // fall through to Node's normal verification against the default trust store.
  if (hostname.endsWith(".supabase.com")) {
    return { ca: SUPABASE_CA_CERT };
  }

  return undefined;
}

const adapter = new PrismaPg({ connectionString: databaseUrl, ssl: resolveSsl() });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
