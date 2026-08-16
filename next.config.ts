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
      // Precisa ficar acima do MAX_FILE_SIZE de 10MB de
      // lib/products/image-actions.ts, com folga para o overhead do
      // multipart/form-data. Se ficar abaixo, o Next aborta a Server Action
      // antes de ela rodar e o usuário não vê erro nenhum.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
