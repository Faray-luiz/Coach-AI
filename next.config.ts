import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverExternalPackages: ['pdf-parse'],
  },
  // Aumenta o limite de corpo de requisição para Server Actions e API Routes (quando suportado)
  serverActions: {
    bodySizeLimit: '10mb',
  }
};

export default nextConfig;
