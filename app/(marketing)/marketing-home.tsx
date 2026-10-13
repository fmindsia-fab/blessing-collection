import Link from "next/link";
import { ActionLink } from "@/components/ui/action";

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

// Renderizado por app/(public)/page.tsx quando a requisição é para o
// apex/www da plataforma (isPlatformRequest()), em vez do catálogo de uma
// loja. Não é page.tsx aqui porque "/" já é resolvido por (public) — dois
// route groups não podem ter page.tsx para a mesma rota.
export function MarketingHome() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 lg:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-[-10%] size-[26rem] rounded-full bg-[var(--gold)]/10 blur-3xl sm:size-[34rem]"
        />
        <div className="reveal relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <span className="text-[0.6875rem] uppercase tracking-[0.22em] text-muted-foreground">
            Catálogo digital para artesãs
          </span>
          <h1 className="font-[family-name:var(--font-brand)] text-[2.5rem] leading-[1.05] tracking-tight sm:text-6xl">
            Sua marca, um catálogo
            <br />
            <span className="italic text-[var(--gold)]">à sua altura</span>
          </h1>
          <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Monte seu catálogo online em minutos, com a cara da sua marca, e venda direto pelo
            WhatsApp — sem taxa por venda, sem complicação.
          </p>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <ActionLink href="/cadastro" variant="solid">
              Criar minha loja grátis
            </ActionLink>
            <span className="text-xs text-muted-foreground">Comece agora, sem cartão de crédito</span>
          </div>
        </div>
      </section>

      {/* Prova social — Blessing Collection */}
      <section className="border-y border-border bg-secondary/30 px-6 py-14 lg:px-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <span className="text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
            Já em uso
          </span>
          <p className="max-w-lg font-[family-name:var(--font-brand)] text-xl leading-snug italic sm:text-2xl">
            &ldquo;Meus pedidos chegam pelo WhatsApp já com a peça, a variação e o preço certinho —
            não preciso mais explicar tudo do zero toda vez.&rdquo;
          </p>
          <div className="flex items-center gap-2 pt-1 text-sm">
            <span className="font-medium">Blessing Collection</span>
            <span aria-hidden className="text-muted-foreground">
              ·
            </span>
            <Link
              href="https://blessingcollection.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground underline underline-offset-4 outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
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
            <span className="text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
              Como funciona
            </span>
            <h2 className="font-[family-name:var(--font-brand)] text-3xl tracking-tight sm:text-4xl">
              Do zero ao primeiro pedido
            </h2>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col gap-3">
                <span className="font-[family-name:var(--font-brand)] text-4xl text-[var(--gold)]">
                  {step.number}
                </span>
                <h3 className="text-lg font-medium">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="border-t border-border bg-secondary/30 px-6 py-24 lg:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-14">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
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
                className="flex flex-col gap-2 rounded-[var(--radius-image)] border border-border bg-card p-6 shadow-sm"
              >
                <h3 className="text-base font-medium">{benefit.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-6 py-24 lg:px-10">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
          <h2 className="font-[family-name:var(--font-brand)] text-3xl tracking-tight sm:text-4xl">
            Pronta para começar?
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Leva poucos minutos, não precisa de cartão de crédito.
          </p>
          <ActionLink href="/cadastro" variant="solid">
            Criar minha loja grátis
          </ActionLink>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground lg:px-10">
        Ateliê Fácil — catálogo digital para artesãs
      </footer>
    </main>
  );
}
