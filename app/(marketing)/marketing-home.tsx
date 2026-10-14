import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ImageIcon } from "lucide-react";
import { YarnSkein, StitchWave, CrochetDots, YarnTangle } from "./craft-motifs";

// Fotos reais de peças da Blessing Collection (primeira loja da
// plataforma) — usadas no hero, na galeria e na prova social enquanto
// outras artesãs ainda não enviaram fotos próprias.
const VALENTINA_PHOTO_URL =
  "https://bipadxpcbmgoatlnnyfw.supabase.co/storage/v1/object/public/product-images/17566e34-c629-429a-999a-3cd28fea7366/61ea7b5b-8f76-4f0b-9d6a-22532f5b720b/ed49601d-557f-4b36-be8d-8fdc0ef92ae6.jpg";

const GALLERY_PHOTOS = [
  {
    url: "https://bipadxpcbmgoatlnnyfw.supabase.co/storage/v1/object/public/product-images/17566e34-c629-429a-999a-3cd28fea7366/9bf29be5-53d7-4447-ba44-0e3840eda3c5/ce975eb0-6040-4be1-a969-45be6487eb37.jpg",
    alt: "Clutch de crochê dourada, peça artesanal",
  },
  {
    url: "https://bipadxpcbmgoatlnnyfw.supabase.co/storage/v1/object/public/product-images/17566e34-c629-429a-999a-3cd28fea7366/99041794-a366-4439-8e66-73c256cd21ae/a022b823-46d2-4eb3-9128-144dfbbf3dfa.png",
    alt: "Colar artesanal com pedra, usado por modelo",
  },
  {
    url: "https://bipadxpcbmgoatlnnyfw.supabase.co/storage/v1/object/public/product-images/17566e34-c629-429a-999a-3cd28fea7366/bfe3b96b-5d78-4b19-ab2d-424c50163b0d/875a96a6-0298-4049-b4e4-651fcbfdb513.png",
    alt: "Case de crochê terracota com cordão",
  },
  {
    url: "https://bipadxpcbmgoatlnnyfw.supabase.co/storage/v1/object/public/product-images/17566e34-c629-429a-999a-3cd28fea7366/84f99a08-258a-47f8-9de3-b0a09843cb2f/cd8ecf8d-ecd0-47ac-9b7e-b7227817dbce.png",
    alt: "Colar artesanal com pingente em formato de estrela-do-mar",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Crie sua loja",
    text: "Nome, endereço e WhatsApp — sua loja fica pronta em poucos minutos, sem precisar de cartão de crédito.",
  },
  {
    number: "02",
    title: "Monte seu catálogo",
    text: "Fotos, preços, variações e coleções. Organize suas peças do seu jeito, direto do celular.",
  },
  {
    number: "03",
    title: "Venda pelo WhatsApp",
    text: "Cada peça gera um link com mensagem pronta — a cliente clica e já chega até você com tudo preenchido.",
  },
];

const BENEFITS = [
  {
    title: "Catálogo que parece seu",
    text: "Cores, fonte e logo da sua marca. Nada de modelo genérico — o visual é todo seu.",
  },
  {
    title: "Sem comissão por venda",
    text: "Você negocia e fecha direto com a cliente, pelo seu próprio WhatsApp. O que você vende é seu.",
  },
  {
    title: "Saiba o que funciona",
    text: "Veja quais peças têm mais visualizações e mais contatos — sem depender de achismo.",
  },
];

// Paleta própria da landing — terracota/mostarda/creme, remetendo a fios e
// fibras naturais. Escopada neste componente via CSS vars locais: não toca
// em --gold nem nas variáveis globais que o catálogo público e o admin
// usam (ver lib/store/admin-theme.ts e app/globals.css).
const PALETTE_VARS = {
  "--craft-bg": "oklch(0.975 0.015 75)",
  "--craft-bg-warm": "oklch(0.93 0.035 60)",
  "--craft-ink": "oklch(0.27 0.03 40)",
  "--craft-muted": "oklch(0.48 0.025 45)",
  "--craft-terracotta": "oklch(0.58 0.14 40)",
  "--craft-mustard": "oklch(0.72 0.13 75)",
  "--craft-card": "oklch(0.995 0.008 70)",
  "--craft-border": "oklch(0.86 0.025 55)",
} as React.CSSProperties;

// CTA principal — maior, com ícone de seta e leve "respiração" (animate-pulse
// no halo), para ficar impossível de ignorar. Repetido 3x na página
// (hero, meio, final) de propósito: cada seção reforça o convite.
function PrimaryCta({ className, label = "Criar minha loja grátis" }: { className?: string; label?: string }) {
  return (
    <Link
      href="/cadastro"
      className={`group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-[var(--craft-terracotta)] px-9 text-sm font-semibold tracking-wide text-[var(--craft-bg)] shadow-lg shadow-[var(--craft-terracotta)]/25 outline-none transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-[var(--craft-terracotta)]/35 focus-visible:ring-2 focus-visible:ring-[var(--craft-terracotta)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--craft-bg)] ${className ?? ""}`}
    >
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-700 group-hover:translate-x-full"
      />
      <span className="relative">{label}</span>
      <ArrowRightIcon className="relative size-4 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

// Placeholder de imagem — moldura artesanal (borda tracejada, cantos macios)
// até as fotos reais entrarem. Mantém a proporção certa reservada no layout
// para a troca ser só de conteúdo, sem redesenhar nada.
function ImagePlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-[var(--radius-image)] border-2 border-dashed border-[var(--craft-terracotta)]/30 bg-[var(--craft-card)] text-[var(--craft-muted)] ${className ?? ""}`}
    >
      <ImageIcon className="size-7 opacity-50" aria-hidden />
      <span className="px-4 text-center text-xs">{label}</span>
    </div>
  );
}

// Renderizado por app/(public)/page.tsx quando a requisição é para o
// apex/www da plataforma (isPlatformRequest()), em vez do catálogo de uma
// loja. Não é page.tsx aqui porque "/" já é resolvido por (public) — dois
// route groups não podem ter page.tsx para a mesma rota.
export function MarketingHome() {
  return (
    <main
      style={PALETTE_VARS}
      className="flex flex-1 flex-col bg-[var(--craft-bg)] text-[var(--craft-ink)]"
    >
      {/* Hero — texto à esquerda, imagem sangrando à direita (mesmo princípio
          assimétrico já usado na home do catálogo público). */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20 sm:pt-20 lg:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-[-8%] size-[28rem] rounded-full bg-[var(--craft-mustard)]/25 blur-3xl sm:size-[36rem]"
        />
        <YarnSkein className="pointer-events-none absolute top-16 left-[4%] hidden w-20 text-[var(--craft-terracotta)]/50 sm:block" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_0.95fr] lg:gap-16">
          <div className="reveal flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--craft-border)] bg-[var(--craft-card)] px-4 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-[var(--craft-terracotta)] shadow-sm">
              <CrochetDots className="size-3.5" />
              Catálogo digital para artesãs
            </span>
            <h1 className="font-[family-name:var(--font-brand)] text-[2.5rem] leading-[1.05] tracking-tight sm:text-6xl">
              Sua marca, um catálogo
              <br />
              <span className="italic text-[var(--craft-terracotta)]">à sua altura</span>
            </h1>
            <p className="max-w-xl text-pretty text-base leading-relaxed text-[var(--craft-muted)] sm:text-lg">
              Monte seu catálogo online em minutos, com a cara da sua marca, e venda direto pelo
              WhatsApp — sem taxa por venda, sem complicação.
            </p>
            <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
              <PrimaryCta />
              <span className="text-xs text-[var(--craft-muted)]">Comece agora, sem cartão de crédito</span>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-image)] bg-[var(--craft-card)] shadow-lg">
              <Image
                src={VALENTINA_PHOTO_URL}
                alt="Bolsa de crochê artesanal feita por uma loja na plataforma"
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 45vw, 100vw"
              />
            </div>
            <div
              aria-hidden
              className="absolute -bottom-5 -left-5 hidden size-24 rounded-full border-2 border-[var(--craft-mustard)]/40 sm:block"
            />
          </div>
        </div>
      </section>

      {/* Galeria — mosaico dedicado só para variedade de peças artesanais. */}
      <section className="px-6 pb-20 lg:px-10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {GALLERY_PHOTOS.map((photo, index) => (
            <div
              key={photo.url}
              className={`relative aspect-square w-full overflow-hidden rounded-[var(--radius-image)] bg-[var(--craft-card)] shadow-sm ${index % 2 === 1 ? "sm:mt-6" : ""}`}
            >
              <Image
                src={photo.url}
                alt={photo.alt}
                fill
                className="object-cover"
                sizes="(min-width: 640px) 23vw, 48vw"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Prova social — depoimento real da Cris, da Blessing Collection. A
          citação e a assinatura já vêm embutidas na própria arte da foto. */}
      <section className="relative overflow-hidden border-y border-[var(--craft-border)] bg-[var(--craft-bg-warm)] px-6 py-16 lg:px-10">
        <YarnTangle className="pointer-events-none absolute -top-10 right-[8%] hidden w-28 text-[var(--craft-terracotta)]/25 md:block" />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
          <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-image)] bg-[var(--craft-card)] shadow-md">
            <Image
              src="/marketing/blessing-depoimento-cris.png"
              alt={'"A plataforma aumentou minha visibilidade, facilitou minhas vendas e encomendas, e hoje estou sabendo precificar melhor minhas peças." — Cris, da Blessing Bolsas'}
              fill
              className="object-cover"
              sizes="(min-width: 640px) 42rem, 100vw"
            />
          </div>
          <Link
            href="https://blessingcollection.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--craft-muted)] underline underline-offset-4 outline-none transition-colors hover:text-[var(--craft-ink)] focus-visible:text-[var(--craft-ink)]"
          >
            ver catálogo da Blessing Collection ↗
          </Link>
        </div>
      </section>

      {/* Como funciona — ilustrado, uma imagem por passo. */}
      <section className="px-6 py-24 lg:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-14">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-[var(--craft-terracotta)]">
              Como funciona
            </span>
            <h2 className="font-[family-name:var(--font-brand)] text-3xl tracking-tight sm:text-4xl">
              Do zero ao primeiro pedido
            </h2>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((step, index) => (
              <div key={step.number} className="relative flex flex-col gap-4">
                {index < STEPS.length - 1 ? (
                  <StitchWave className="pointer-events-none absolute top-6 left-[calc(100%+0.5rem)] hidden w-14 text-[var(--craft-border)] sm:block" />
                ) : null}
                <ImagePlaceholder label={`Ilustração do passo ${step.number}`} className="aspect-[4/3] w-full" />
                <div className="flex flex-col gap-2">
                  <span className="font-[family-name:var(--font-brand)] text-2xl text-[var(--craft-mustard)]">
                    {step.number}
                  </span>
                  <h3 className="text-lg font-medium">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--craft-muted)]">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="relative overflow-hidden border-t border-[var(--craft-border)] bg-[var(--craft-bg-warm)] px-6 py-24 lg:px-10">
        <YarnSkein className="pointer-events-none absolute bottom-[-2rem] left-[-2rem] hidden w-32 text-[var(--craft-mustard)]/30 lg:block" />
        <div className="relative mx-auto flex max-w-5xl flex-col gap-14">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-[var(--craft-terracotta)]">
              Por que o Ateliê Fácil
            </span>
            <h2 className="font-[family-name:var(--font-brand)] text-3xl tracking-tight sm:text-4xl">
              Feito para quem faz à mão
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="flex flex-col gap-2 rounded-[var(--radius-image)] border border-[var(--craft-border)] bg-[var(--craft-card)] p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="text-base font-medium">{benefit.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--craft-muted)]">{benefit.text}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <PrimaryCta label="Quero minha loja também" />
          </div>
        </div>
      </section>

      {/* CTA final — maior destaque, bloco colorido sólido para fechar com
          urgência visual diferente do resto da página. */}
      <section className="relative overflow-hidden bg-[var(--craft-terracotta)] px-6 py-24 text-[var(--craft-bg)] lg:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl"
        />
        <StitchWave className="pointer-events-none absolute top-10 left-[10%] hidden w-40 text-white/25 md:block" />
        <StitchWave className="pointer-events-none absolute bottom-10 right-[10%] hidden w-40 text-white/25 md:block" />
        <div className="relative mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
          <h2 className="font-[family-name:var(--font-brand)] text-3xl tracking-tight sm:text-4xl">
            Pronta para começar?
          </h2>
          <p className="text-sm text-white/80 sm:text-base">
            Leva poucos minutos, não precisa de cartão de crédito.
          </p>
          <Link
            href="/cadastro"
            className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-white px-9 text-sm font-semibold tracking-wide text-[var(--craft-terracotta)] shadow-lg outline-none transition-all duration-300 hover:scale-[1.03] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--craft-terracotta)]"
          >
            Criar minha loja grátis
            <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--craft-border)] px-6 py-8 text-center text-xs text-[var(--craft-muted)] lg:px-10">
        Ateliê Fácil — catálogo digital para artesãs
      </footer>
    </main>
  );
}
