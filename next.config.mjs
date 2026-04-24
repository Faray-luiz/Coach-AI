/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    serverExternalPackages: ['pdf-parse'],
  },
};

export default nextConfig;
