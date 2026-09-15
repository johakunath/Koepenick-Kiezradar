import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/eintrag/*": ["./data/archive/*.json"],
  },
};

export default nextConfig;
