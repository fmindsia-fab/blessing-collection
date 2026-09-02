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
    // já estourada duas vezes). Conjunto de reduções recomendado pela própria
    // doc da Vercel ("Reducing Usage" em Image Optimization):
    //
    // deviceSizes/imageSizes: restrito às larguras que algum `sizes=` deste
    // site realmente pede — o maior é ~55vw em telas de até ~2560px, nunca os
    // 3840px do padrão do Next. Não perde nitidez em nenhum dispositivo real,
    // só corta variações nunca solicitadas.
    deviceSizes: [420, 640, 828, 1080, 1440, 1920],
    imageSizes: [64, 96, 128, 160, 256],
    // formats: nenhum componente pede AVIF explicitamente, e o padrão do Next
    // gera AVIF *e* WebP por combinação de tamanho — dobrando as transformações
    // por foto. Servir só WebP (suportado por todo navegador atual) corta essa
    // duplicação sem perda visível de qualidade.
    formats: ["image/webp"],
    // qualities: nenhum <Image> deste projeto define `quality`, todos usam o
    // padrão implícito (75). Travar a allowlist em [75] impede que uma
    // qualidade diferente e não intencional crie uma transformação nova.
    qualities: [75],
    // minimumCacheTTL: fotos de produto não mudam depois de publicadas (a
    // proprietária substitui o arquivo, não edita a URL) — 31 dias reduz
    // quantas vezes a mesma transformação é regravada no cache da Vercel.
    minimumCacheTTL: 2678400,
    // TEMPORÁRIO (3ª vez): cota de Image Optimization do plano gratuito
    // segue em 402 mesmo com a config econômica acima (formats/qualities/
    // deviceSizes reduzidos) — ela só limita o RITMO futuro de consumo, não
    // devolve o que já foi gasto no ciclo atual. unoptimized tira a Vercel
    // dessa conta: <Image> aponta direto para a URL original do Supabase
    // Storage. Custo aceito por ora: fotos mais lentas em conexão fraca.
    // Remover assim que o ciclo renovar (checar em Vercel → Settings →
    // Billing a data exata) — e se estourar de novo rápido depois disso,
    // considerar upgrade de plano ou migrar para a transformação de imagem
    // do Supabase Storage em vez de repetir este ciclo de novo.
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
