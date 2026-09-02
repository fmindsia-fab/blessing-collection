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
    // Cada combinação (imagem × largura × qualidade) é 1 transformação
    // faturável na Vercel, cacheada por 30 dias depois de gerada. O padrão do
    // Next tem 8 deviceSizes (até 3840px) + 8 imageSizes — muito mais largura
    // do que qualquer `sizes=` deste site pede (o maior é ~55vw em telas de
    // até ~2560px). Restringir a lista não piora nitidez em nenhum
    // dispositivo real: só corta variações que nunca são solicitadas,
    // reduzindo o número de transformações únicas por foto.
    deviceSizes: [420, 640, 828, 1080, 1440, 1920],
    imageSizes: [64, 96, 128, 160, 256],
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
