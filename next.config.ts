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
    // Cada combinação (imagem × largura × qualidade × formato) é 1
    // transformação faturável na Vercel. O time fez upgrade para o plano Pro
    // (5 set 2026) especificamente por causa da cota de Image Optimization,
    // que no plano Free (5.000/mês) estourava repetidamente. Otimização
    // reativada — o Pro cobre uso sob demanda além do crédito incluso, em
    // vez de bloquear com 402 como o Free fazia.
    //
    // Conjunto de reduções recomendado pela doc da Vercel ("Reducing Usage"
    // em Image Optimization) mantido mesmo no Pro — sem custo em nitidez,
    // só evita gastar crédito/cota com variações que este site não usa:
    deviceSizes: [420, 640, 828, 1080, 1440, 1920],
    imageSizes: [64, 96, 128, 160, 256],
    formats: ["image/webp"],
    qualities: [75],
    minimumCacheTTL: 2678400,
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
