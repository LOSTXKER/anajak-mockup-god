// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // ป้องกันไม่ให้ Konva รันใน server-side
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'konva']
    }
    return config
  }
};

export default nextConfig;