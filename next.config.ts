import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default is 1MB, which real uploaded documents/photos exceed. Vercel's
    // Serverless Functions hard-cap the whole request at 4.5MB, so this stays
    // under that with room for multipart boundaries/headers overhead.
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  // pdfkit reads its .afm font files at runtime via `__dirname + "/data/..."`.
  // Left to Next's default bundling this path gets rewritten to a bogus
  // `/ROOT/...` placeholder (ENOENT at export time) — excluding it here makes
  // Next require() it natively instead, so `__dirname` resolves for real.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
