import path from "path";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * The Prisma CLI resolves a relative `file:` URL relative to prisma/schema.prisma's
 * directory (so migrate/studio always agree on where the SQLite file lives), but the
 * generated client resolves it relative to its own generated-code directory at
 * runtime — neither of which matches. We resolve it the same way the CLI does
 * (relative to the prisma/ folder) and pass it in explicitly so both agree.
 */
function resolveDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("file:")) return url;

  const filePath = url.slice("file:".length);
  if (path.isAbsolute(filePath)) return url;

  const prismaDir = path.resolve(/* turbopackIgnore: true */ process.cwd(), "prisma");
  return `file:${path.resolve(/* turbopackIgnore: true */ prismaDir, filePath)}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: resolveDatasourceUrl() });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
