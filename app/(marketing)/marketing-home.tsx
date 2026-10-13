import Link from "next/link";
import { YarnSkein, StitchWave, CrochetDots, YarnTangle } from "./craft-motifs";

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
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-28 sm:pt-28 sm:pb-36 lg:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-[-8%] size-[28rem] rounded-full bg-[var(--craft-mustard)]/25 blur-3xl sm:size-[36rem]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-6rem] left-[-6rem] size-[20rem] rounded-full bg-[var(--craft-terracotta)]/15 blur-3xl"
        />
        <YarnSkein className="pointer-events-none absolute top-16 left-[4%] hidden w-24 text-[var(--craft-terracotta)]/50 sm:block lg:left-[8%]" />
        <StitchWave className="pointer-events-none absolute right-[6%] bottom-10 hidden w-40 text-[var(--craft-mustard)]/60 sm:block" />

        <div className="reveal relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
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
            <Link
              href="/cadastro"
              className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-[var(--craft-terracotta)] px-8 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-[var(--craft-bg)] shadow-md transition-all duration-300 outline-none hover:shadow-lg hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--craft-terracotta)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--craft-bg)]"
            >
              Criar minha loja grátis
            </Link>
            <span className="text-xs text-[var(--craft-muted)]">Comece agora, sem cartão de crédito</span>
          </div>
        </div>
      </section>

      {/* Prova social — Blessing Collection */}
      <section className="relative overflow-hidden border-y border-[var(--craft-border)] bg-[var(--craft-bg-warm)] px-6 py-16 lg:px-10">
        <YarnTangle className="pointer-events-none absolute -top-10 right-[8%] hidden w-28 text-[var(--craft-terracotta)]/25 md:block" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <span className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-[var(--craft-terracotta)]">
            Já em uso
          </span>
          <p className="max-w-lg font-[family-name:var(--font-brand)] text-xl leading-snug italic sm:text-2xl">
            &ldquo;Meus pedidos chegam pelo WhatsApp já com a peça, a variação e o preço certinho —
            não preciso mais explicar tudo do zero toda vez.&rdquo;
          </p>
          <div className="flex items-center gap-2 pt-1 text-sm">
            <span className="font-medium">Blessing Collection</span>
            <span aria-hidden className="text-[var(--craft-muted)]">
              ·
            </span>
            <Link
              href="https://blessingcollection.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--craft-muted)] underline underline-offset-4 outline-none transition-colors hover:text-[var(--craft-ink)] focus-visible:text-[var(--craft-ink)]"
            >
              ver catálogo ↗
            </Link>
          </div>
        </div>
      </section>

      {/* Como funciona */}
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
              <div key={step.number} className="relative flex flex-col gap-3">
                {index < STEPS.length - 1 ? (
                  <StitchWave className="pointer-events-none absolute top-6 left-[calc(100%+0.5rem)] hidden w-14 text-[var(--craft-border)] sm:block" />
                ) : null}
                <span className="font-[family-name:var(--font-brand)] text-4xl text-[var(--craft-mustard)]">
                  {step.number}
                </span>
                <h3 className="text-lg font-medium">{step.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--craft-muted)]">{step.text}</p>
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
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden px-6 py-24 lg:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--craft-terracotta)]/10 blur-3xl"
        />
        <div className="relative mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
          <h2 className="font-[family-name:var(--font-brand)] text-3xl tracking-tight sm:text-4xl">
            Pronta para começar?
          </h2>
          <p className="text-sm text-[var(--craft-muted)] sm:text-base">
            Leva poucos minutos, não precisa de cartão de crédito.
          </p>
          <Link
            href="/cadastro"
            className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-[var(--craft-terracotta)] px-8 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-[var(--craft-bg)] shadow-md transition-all duration-300 outline-none hover:shadow-lg hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--craft-terracotta)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--craft-bg)]"
          >
            Criar minha loja grátis
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--craft-border)] px-6 py-8 text-center text-xs text-[var(--craft-muted)] lg:px-10">
        Ateliê Fácil — catálogo digital para artesãs
      </footer>
    </main>
  );
}
