import type { NextConfig } from "next";

const allowedDevOrigins = new Set<string>([
  "localhost",
  "127.0.0.1",
  "192.168.15.16",
]);

const envAllowedOrigins = process.env.ALLOWED_DEV_ORIGINS?.split(",")
  .map((item) => item.trim())
  .filter(Boolean);

for (const origin of envAllowedOrigins ?? []) {
  allowedDevOrigins.add(origin);
}

const nextConfig: NextConfig = {
  allowedDevOrigins: [...allowedDevOrigins],
};

export default nextConfig;
