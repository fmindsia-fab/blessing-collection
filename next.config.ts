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
      // Precisa ficar acima do maior MAX_FILE_SIZE entre as Server Actions de
      // upload — hoje o de lib/products/video-actions.ts (40MB) é o maior,
      // com folga para o overhead do multipart/form-data e o poster (JPEG)
      // enviado junto. Se ficar abaixo, o Next aborta a Server Action antes de
      // ela rodar e o usuário não vê erro nenhum.
      bodySizeLimit: "45mb",
    },
  },
};

export default nextConfig;
