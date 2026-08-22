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
};

export default nextConfig;
