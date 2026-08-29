import type { Metadata } from "next";
import { ActionLink } from "@/components/ui/action";

export const metadata: Metadata = {
  title: "Blessing Collection | Catálogo digital para artesãs e lojistas",
  description:
    "Monte seu catálogo digital em minutos e receba pedidos pelo WhatsApp. Para artesãs, boutiques de roupas e lojas de calçados.",
};

const SEGMENTS = [
  {
    n: "01",
    label: "Artesanato",
    detail: "Bolsas, acessórios e peças únicas — sem grade fixa.",
  },
  {
    n: "02",
    label: "Roupas",
    detail: "Grade completa, do PP ao XG, pronta pro seu catálogo.",
  },
  {
    n: "03",
    label: "Calçados",
    detail: "Numeração 33 a 44, organizada por modelo.",
  },
];

const STEPS = [
  { n: "1", title: "Crie sua loja", detail: "Nome, tipo de negócio e sua URL própria. Dois minutos." },
  { n: "2", title: "Cadastre as peças", detail: "Fotos, preço, variações. Tudo do seu jeito." },
  { n: "3", title: "Venda pelo WhatsApp", detail: "Cliente escolhe, clica, e cai direto na conversa." },
];

export default function LandingPage() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      {/* Fio vertical decorativo — ancora a composição assimétrica sem
          depender de fotografia, que a plataforma (ao contrário de uma loja)
          ainda não tem. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border to-transparent lg:block"
      />

      {/* ===== CAPA ===== */}
      <section className="relative flex flex-col items-center gap-10 px-6 pb-20 pt-20 text-center sm:px-10 sm:pt-28 lg:pb-28 lg:pt-36">
        {/* Atmosfera de fundo: gradiente mesh ancorado no dourado da marca +
            um segundo véu mais frio, sobre a textura de papel já existente no
            .brand-scope. Dá profundidade sem depender de fotografia (a
            plataforma, ao contrário de uma loja, ainda não tem produto para
            mostrar) e sem sair da paleta pergaminho/marrom-tinta. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute -top-32 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full opacity-[0.16] blur-3xl"
            style={{
              background:
                "radial-gradient(circle, var(--gold) 0%, transparent 68%)",
            }}
          />
          <div
            className="absolute right-[8%] top-1/3 h-[26rem] w-[26rem] rounded-full opacity-[0.10] blur-3xl"
            style={{
              background: "radial-gradient(circle, oklch(0.42 0.03 40) 0%, transparent 70%)",
            }}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent" />
        </div>

        <span
          className="reveal text-[0.625rem] uppercase tracking-[0.32em] text-muted-foreground"
          style={{ animationDelay: "0ms" }}
        >
          Blessing Collection · Catálogos digitais
        </span>

        <h1
          className="reveal max-w-4xl font-[family-name:var(--font-landing-display)] text-[2.75rem] font-light leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl"
          style={{ animationDelay: "90ms" }}
        >
          Seu catálogo,
          <br />
          <span className="italic text-[var(--gold)]">à venda</span> no WhatsApp
        </h1>

        <p
          className="reveal max-w-lg text-[0.9375rem] leading-relaxed text-muted-foreground"
          style={{ animationDelay: "180ms" }}
        >
          Para artesãs, boutiques de roupas e lojas de calçados. Cadastre suas peças, organize por
          categoria e coleção, e receba pedidos direto no WhatsApp.
        </p>

        <div className="reveal flex flex-wrap items-center justify-center gap-5 pt-2" style={{ animationDelay: "270ms" }}>
          <ActionLink href="/cadastro" variant="solid" arrow>
            Começar teste grátis
          </ActionLink>
          <ActionLink href="#como-funciona" variant="underline">
            Como funciona
          </ActionLink>
        </div>

        <span className="reveal pt-6 text-[0.6875rem] uppercase tracking-[0.18em] text-muted-foreground/70" style={{ animationDelay: "340ms" }}>
          Teste grátis · Cadastre até 10 produtos · Sua loja no ar em minutos
        </span>
      </section>

      {/* ===== SEGMENTOS — prova de que o cadastro se adapta ao negócio ===== */}
      <section className="relative border-y border-border px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
        <div className="mx-auto flex max-w-5xl flex-col gap-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="kicker">Feito para o seu segmento</span>
            <h2 className="font-[family-name:var(--font-landing-display)] text-3xl font-light tracking-tight sm:text-4xl">
              O cadastro se adapta a você
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-image)] border border-border bg-border shadow-[0_20px_60px_-30px_oklch(0.25_0.02_45/0.35)] sm:grid-cols-3">
            {SEGMENTS.map((segment) => (
              <div
                key={segment.n}
                className="group relative flex flex-col gap-4 bg-card px-8 py-10 transition-all duration-500 hover:z-10 hover:-translate-y-1 hover:bg-secondary hover:shadow-[0_24px_48px_-24px_oklch(0.25_0.02_45/0.35)]"
              >
                <span className="font-[family-name:var(--font-landing-display)] text-sm text-[var(--gold)]">
                  {segment.n}
                </span>
                <h3 className="font-[family-name:var(--font-landing-display)] text-2xl font-light tracking-tight">
                  {segment.label}
                </h3>
                <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">{segment.detail}</p>
                <span
                  aria-hidden
                  className="mt-1 h-px w-8 bg-border transition-all duration-500 group-hover:w-14 group-hover:bg-[var(--gold)]"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMO FUNCIONA ===== */}
      <section id="como-funciona" className="scroll-mt-20 px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto flex max-w-3xl flex-col gap-14">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="kicker">O caminho</span>
            <h2 className="font-[family-name:var(--font-landing-display)] text-3xl font-light tracking-tight sm:text-4xl">
              Do zero ao primeiro pedido
            </h2>
          </div>

          <ol className="flex flex-col divide-y divide-border border-y border-border">
            {STEPS.map((step) => (
              <li key={step.n} className="flex items-start gap-6 py-7 sm:items-center">
                <span className="font-[family-name:var(--font-landing-display)] text-4xl font-light text-muted-foreground/40 sm:text-5xl">
                  {step.n}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-base font-medium">{step.title}</span>
                  <span className="text-sm leading-relaxed text-muted-foreground">{step.detail}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="relative overflow-hidden border-t border-border bg-foreground px-6 py-20 text-center sm:px-10 lg:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.14] blur-3xl"
          style={{ background: "radial-gradient(circle, var(--gold) 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(oklch(0.985 0.005 75) 0.5px, transparent 0.5px)",
            backgroundSize: "4px 4px",
          }}
        />
        <div className="relative mx-auto flex max-w-lg flex-col items-center gap-7">
          <h2 className="font-[family-name:var(--font-landing-display)] text-4xl font-light leading-[1.05] tracking-tight text-background sm:text-5xl">
            Sua vitrine <span className="italic text-[var(--gold)]">começa</span> agora
          </h2>
          <p className="text-sm leading-relaxed text-background/70">
            Teste grátis, sem cartão de crédito. Cadastre até 10 produtos e comece a vender hoje.
          </p>
          <ActionLink
            href="/cadastro"
            variant="outline"
            arrow
            className="border-background/40 text-background hover:bg-background hover:text-foreground"
          >
            Começar teste grátis
          </ActionLink>
        </div>
      </section>
    </main>
  );
}
