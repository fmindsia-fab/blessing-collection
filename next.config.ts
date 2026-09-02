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
    // transformação faturável na Vercel (cota do plano gratuito: 5.000/mês,
    // já estourada repetidamente). Migrar para a transformação de imagem do
    // Supabase Storage foi avaliado e descartado: o painel do próprio
    // Supabase mostra "Storage Image Transformations — Not included in
    // plan" no projeto atual (Free) — o endpoint responde e transforma de
    // fato, mas não é um recurso coberto pelo plano, e pode ser cobrado ou
    // bloqueado sem aviso. Trocaria um limite estourado por outro.
    //
    // Conjunto de reduções recomendado pela doc da Vercel ("Reducing Usage"
    // em Image Optimization) permanece, para esticar o quanto der a cota
    // atual:
    deviceSizes: [420, 640, 828, 1080, 1440, 1920],
    imageSizes: [64, 96, 128, 160, 256],
    formats: ["image/webp"],
    qualities: [75],
    minimumCacheTTL: 2678400,
    // TEMPORÁRIO: cota da Vercel segue estourada (402 em /_next/image) — a
    // config econômica acima só reduz o ritmo futuro de consumo, não
    // devolve o que já foi gasto no ciclo atual. unoptimized tira a Vercel
    // dessa conta: <Image> aponta direto para a URL original do Supabase
    // Storage, sem otimização (fotos mais lentas em conexão fraca, mas sem
    // quebrar). Remover quando o ciclo renovar (Vercel → Settings →
    // Billing) — se estourar de novo rápido, a decisão real que falta é
    // upgrade de plano (Vercel Pro ou Supabase Pro), não outra config.
    unoptimized: true,
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
