import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next's output tracing can miss Prisma's native query engine binaries
  // since they're only referenced via runtime path.join() calls, not static
  // imports — force them into every route's serverless bundle.
  outputFileTracingIncludes: {
    "/*": ["./src/generated/prisma/**/*"],
  },
};

export default nextConfig;
