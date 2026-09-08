import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { SUPABASE_CA_CERT } from "@/lib/supabase-ca";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const parsedUrl = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : undefined;
const hostname = parsedUrl?.hostname ?? "";

function resolveSsl(): { ca: string } | undefined {
  if (hostname === "localhost" || hostname === "127.0.0.1") return undefined;

  // Other hosted providers (e.g. Neon) use publicly-trusted certs, so they
  // fall through to Node's normal verification against the default trust store.
  if (hostname.endsWith(".supabase.com")) {
    return { ca: SUPABASE_CA_CERT };
  }

  return undefined;
}

const ssl = resolveSsl();
if (ssl && parsedUrl) {
  // pg's connection-string parser derives its own `ssl` object from
  // `sslmode` and applies it *after* (overwriting) any explicit ssl config
  // passed alongside connectionString — so sslmode=require silently wins
  // over our CA. Strip it to let our explicit config take effect.
  parsedUrl.searchParams.delete("sslmode");
}

const adapter = new PrismaPg({ connectionString: parsedUrl?.toString(), ssl });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
