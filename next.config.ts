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
      // Cobre o upload de imagem (MAX_FILE_SIZE de 10MB em
      // lib/products/image-actions.ts), com folga para o multipart/form-data.
      // O upload de vídeo NÃO passa por Server Action — o corpo da requisição
      // é limitado a 4.5MB pela própria infraestrutura da Vercel (Serverless
      // Functions), teto que este `bodySizeLimit` não consegue elevar. Por
      // isso o vídeo sobe direto do navegador ao Supabase Storage
      // (lib/videos/upload-video-client.ts); só a URL resultante passa por
      // uma Server Action (lib/products/video-actions.ts).
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
