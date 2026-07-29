import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Acima do limite de 5MB do PRD para imagens de produto (seção 13.1),
      // com folga para o overhead do multipart/form-data.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
