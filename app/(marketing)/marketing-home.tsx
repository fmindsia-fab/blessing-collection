import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { YarnSkein, StitchWave, CrochetDots, YarnTangle, YarnBall, CrochetHooks } from "./craft-motifs";

// Foto de uma artesã trabalhando, com o catálogo de bolsas visível no
// laptop/tablet ao fundo — fornecida pelo usuário.
const HERO_PHOTO_URL = "/marketing/hero-produto.jpg";

// "Por dentro do AteliFácil" — 3 cards com imagem real + título + texto,
// dando contexto a cada print em vez de deixá-los soltos. Reaproveita a
// foto do hero (card 1) e os 2 prints que já existiam na galeria.
const SHOWCASE_CARDS = [
  {
    url: HERO_PHOTO_URL,
    alt: "Artesã produzindo uma bolsa de crochê, com o catálogo de produtos visível no notebook",
    title: "Sua vitrine, com a sua identidade",
    text: "Apresente suas peças com fotos, preços, variações e todos os detalhes que sua cliente precisa.",
  },
  {
    url: "/marketing/galeria-pedidos.jpg",
    alt: "Painel de pedidos organizados por etapa: orçamento, confirmado, em produção, entregue",
    title: "Pedidos sem bagunça",
    text: "Saiba o que está em orçamento, confirmado, em produção ou já foi entregue.",
  },
  {
    url: "/marketing/galeria-colecoes.jpg",
    alt: "Coleções do catálogo público: Blessing, Moda Praia, Casual, Festa",
    title: "Coleções que facilitam a escolha",
    text: "Organize seus produtos por categoria, estilo ou ocasião e deixe seu catálogo mais fácil de navegar.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Crie sua loja",
    text: "Nome, endereço e WhatsApp — sua loja fica pronta em poucos minutos, sem precisar de cartão de crédito.",
    image: "/marketing/passo-01-loja.png",
  },
  {
    number: "02",
    title: "Monte seu catálogo",
    text: "Fotos, preços, variações e coleções. Organize suas peças do seu jeito, direto do celular.",
    image: "/marketing/passo-02-catalogo.png",
  },
  {
    number: "03",
    title: "Venda pelo WhatsApp",
    text: "Cada peça gera um link com mensagem pronta — a cliente clica e já chega até você com tudo preenchido.",
    image: "/marketing/passo-03-whatsapp.png",
  },
];

const BENEFITS = [
  {
    title: "Catálogo profissional",
    text: "Organize suas peças, fotos, preços, variações e coleções — tudo num só lugar, sem planilha e sem bagunça.",
  },
  {
    title: "Encomendas organizadas",
    text: "Prazo, personalização e sinal registrados em cada pedido. Nada mais de anotar no caderno ou esquecer no chat.",
  },
  {
    title: "Pedidos pelo WhatsApp",
    text: "A cliente escolhe a peça e já chega até você com produto, variação e preço preenchidos — sem reexplicar tudo.",
  },
  {
    title: "Sua identidade visual",
    text: "Cores, fonte e logo do seu próprio ateliê. Nada de modelo genérico — o catálogo tem a cara da sua marca.",
  },
  {
    title: "Precificação com mais segurança",
    text: "Organize seus custos e saiba exatamente quanto cobrar — valorize seu trabalho com números, não achismo.",
  },
  {
    title: "Mais visibilidade e vendas",
    text: "Compartilhe o link da sua loja onde quiser e leve cada cliente direto para o catálogo certo.",
  },
];

const BEFORE_AFTER = {
  before: [
    "Fotos espalhadas no celular",
    "Cliente perguntando preço toda hora",
    "Pedidos anotados no caderno",
    "Encomendas perdidas no WhatsApp",
    "Difícil mostrar todas as opções",
    "Difícil parecer profissional",
  ],
  after: [
    "Catálogo organizado e sempre à mão",
    "Preços e informações já disponíveis",
    "Pedidos centralizados num só lugar",
    "Encomendas com prazo e sinal registrados",
    "Cliente vê todas as peças de uma vez",
    "Marca com cara de negócio sério",
  ],
};

const FAQ_ITEMS = [
  {
    question: "Preciso saber criar site?",
    answer: "Não. Você preenche nome, fotos e preços — o catálogo é montado automaticamente, sem nenhum conhecimento técnico.",
  },
  {
    question: "Preciso ter CNPJ?",
    answer: "Não é obrigatório. Muitas artesãs usam a plataforma vendendo como pessoa física.",
  },
  {
    question: "Posso usar só o plano gratuito?",
    answer: "Sim. Você cria sua loja e começa a vender sem precisar de cartão de crédito.",
  },
  {
    question: "O AteliFácil cobra comissão por venda?",
    answer: "Não. A negociação e o pagamento acontecem direto entre você e a cliente, pelo seu WhatsApp — o que você vende é seu.",
  },
  {
    question: "Minha cliente precisa instalar algum aplicativo?",
    answer: "Não. Ela acessa seu catálogo pelo navegador e fala com você pelo WhatsApp normal, sem instalar nada.",
  },
  {
    question: "Posso receber pedidos pelo WhatsApp?",
    answer: "Sim. Cada peça gera um link com mensagem pronta — a cliente clica e chega até você com tudo preenchido.",
  },
  {
    question: "Posso cadastrar produtos sob encomenda?",
    answer: "Sim. Você marca a peça como sob encomenda e define prazo, personalização e sinal.",
  },
  {
    question: "Posso personalizar minha loja?",
    answer: "Sim. Cores, fonte e logo seguem a identidade do seu próprio ateliê.",
  },
  {
    question: "Funciona no celular?",
    answer: "Sim, tanto para você gerenciar a loja quanto para suas clientes navegarem no catálogo — pensado para o celular desde o início.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer: "Sim, sem burocracia e sem multa.",
  },
];

// Paleta oficial da marca AteliFácil — terracota, marrom, bege, creme e
// rosa suave (ver referência de logo/identidade visual). Escopada neste
// componente via CSS vars locais: não toca em --gold nem nas variáveis
// globais que o catálogo público e o admin usam (ver lib/store/admin-theme.ts
// e app/globals.css). --craft-mustard foi substituído por --craft-rose
// (rosa suave) para bater com a paleta oficial; o nome da variável
// ("mustard") não reflete mais a cor, mas trocar o nome exigiria atualizar
// todas as ocorrências no JSX abaixo sem ganho real.
const PALETTE_VARS = {
  "--craft-bg": "oklch(0.975 0.015 75)",
  "--craft-bg-warm": "oklch(0.93 0.035 60)",
  "--craft-ink": "oklch(0.27 0.03 40)",
  "--craft-muted": "oklch(0.48 0.025 45)",
  "--craft-terracotta": "oklch(0.58 0.14 40)",
  "--craft-mustard": "oklch(0.8 0.05 15)",
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
      <header className="px-6 pt-5 pb-1 lg:px-10">
        <div className="mx-auto flex max-w-6xl justify-center lg:justify-start">
          <div className="relative h-24 w-[380px] sm:h-28 sm:w-[440px]">
            <Image
              src="/marketing/logo-atelifacil.png"
              alt="AteliFácil"
              fill
              priority
              className="object-contain object-left"
              sizes="440px"
            />
          </div>
        </div>
      </header>

      {/* Hero — texto à esquerda, imagem sangrando à direita (mesmo princípio
          assimétrico já usado na home do catálogo público). Primeira dobra:
          espaçamento vertical enxuto de propósito para caber logo + headline
          + CTA + boa parte do mockup sem rolar muito. */}
      <section className="relative overflow-hidden px-6 pt-2 pb-14 sm:pt-3 lg:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-[-8%] size-[28rem] rounded-full bg-[var(--craft-mustard)]/25 blur-3xl sm:size-[36rem]"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.95fr] lg:gap-16">
          <div className="reveal flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--craft-border)] bg-[var(--craft-card)] px-4 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-[var(--craft-terracotta)] shadow-sm">
              <CrochetDots className="size-3.5" />
              Seu ateliê, mais profissional
            </span>
            <h1 className="font-[family-name:var(--font-brand)] text-[2.25rem] leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              Sua marca, um catálogo
              <br />
              <span className="italic text-[var(--craft-terracotta)]">à sua altura</span>
            </h1>
            <p className="max-w-md text-pretty text-base leading-relaxed text-[var(--craft-muted)] sm:text-lg">
              Crie seu catálogo, organize suas encomendas e receba pedidos direto no WhatsApp —
              sem comissão por venda.
            </p>
            <div className="mt-1 flex flex-col items-center gap-2 sm:items-start">
              <PrimaryCta />
              <span className="text-xs text-[var(--craft-muted)]">
                Sem cartão de crédito • Configure em poucos minutos
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-image)] bg-[var(--craft-card)] shadow-xl ring-1 ring-[var(--craft-border)]">
              <Image
                src={HERO_PHOTO_URL}
                alt="Artesã produzindo uma bolsa de crochê, com o catálogo de produtos visível no notebook"
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 45vw, 90vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Por dentro do AteliFácil — demonstração de valor com contexto:
          cada print vira um card com título e texto, em vez de imagens
          soltas sem explicação. */}
      <section className="relative overflow-hidden px-6 pb-24 lg:px-10">
        <CrochetHooks className="pointer-events-none absolute -top-2 right-[6%] hidden w-16 text-[var(--craft-terracotta)]/35 md:block" />
        <div className="mx-auto flex max-w-5xl flex-col gap-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-[var(--craft-terracotta)]">
              Por dentro do AteliFácil
            </span>
            <h2 className="font-[family-name:var(--font-brand)] text-3xl tracking-tight sm:text-4xl">
              Tudo do seu ateliê, organizado em um só lugar
            </h2>
            <p className="max-w-xl text-pretty text-base leading-relaxed text-[var(--craft-muted)]">
              Do catálogo ao pedido, você apresenta melhor suas peças e mantém suas vendas e
              encomendas mais organizadas.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {SHOWCASE_CARDS.map((card) => (
              <div key={card.title} className="flex flex-col gap-4">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-image)] border border-[var(--craft-border)] bg-[var(--craft-card)] shadow-sm">
                  <Image
                    src={card.url}
                    alt={card.alt}
                    fill
                    className="object-cover object-top"
                    sizes="(min-width: 640px) 30vw, 90vw"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-base font-medium">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--craft-muted)]">{card.text}</p>
                </div>
              </div>
            ))}
          </div>
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
      <section className="relative overflow-hidden px-6 py-24 lg:px-10">
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
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-image)] border border-[var(--craft-border)] bg-[var(--craft-card)]">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover"
                    sizes="(min-width: 640px) 30vw, 90vw"
                  />
                </div>
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

      {/* Antes / Depois — contraste emocional entre a rotina sem e com a
          plataforma, pensado para a visitante se reconhecer no "antes". */}
      <section className="relative overflow-hidden border-t border-[var(--craft-border)] px-6 py-24 lg:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-14">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-[var(--craft-terracotta)]">
              A diferença no dia a dia
            </span>
            <h2 className="font-[family-name:var(--font-brand)] text-3xl tracking-tight sm:text-4xl">
              Do jeito antigo para o jeito fácil
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-[var(--radius-image)] border border-[var(--craft-border)] bg-[var(--craft-card)] p-7">
              <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--craft-muted)]">
                Antes
              </h3>
              <ul className="flex flex-col gap-3">
                {BEFORE_AFTER.before.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--craft-muted)]">
                    <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--craft-border)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-4 rounded-[var(--radius-image)] border border-[var(--craft-terracotta)]/30 bg-[var(--craft-bg-warm)] p-7 shadow-sm">
              <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--craft-terracotta)]">
                Com o AteliFácil
              </h3>
              <ul className="flex flex-col gap-3">
                {BEFORE_AFTER.after.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--craft-ink)]">
                    <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--craft-terracotta)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="relative overflow-hidden border-t border-[var(--craft-border)] bg-[var(--craft-bg-warm)] px-6 py-24 lg:px-10">
        <YarnSkein className="pointer-events-none absolute bottom-[-2rem] left-[-2rem] hidden w-32 text-[var(--craft-mustard)]/30 lg:block" />
        <YarnBall className="pointer-events-none absolute top-8 right-[4%] hidden w-14 text-[var(--craft-terracotta)]/45 lg:block" />
        <div className="relative mx-auto flex max-w-5xl flex-col gap-14">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-[var(--craft-terracotta)]">
              Por que o AteliFácil
            </span>
            <h2 className="font-[family-name:var(--font-brand)] text-3xl tracking-tight sm:text-4xl">
              Tudo que seu ateliê precisa para vender melhor
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* FAQ — respostas às objeções mais comuns antes do cadastro. */}
      <section className="relative overflow-hidden px-6 py-24 lg:px-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-[var(--craft-terracotta)]">
              Perguntas frequentes
            </span>
            <h2 className="font-[family-name:var(--font-brand)] text-3xl tracking-tight sm:text-4xl">
              Tire suas dúvidas
            </h2>
          </div>

          <dl className="flex flex-col divide-y divide-[var(--craft-border)] rounded-[var(--radius-image)] border border-[var(--craft-border)] bg-[var(--craft-card)]">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question} className="flex flex-col gap-2 p-6">
                <dt className="text-base font-medium">{item.question}</dt>
                <dd className="text-sm leading-relaxed text-[var(--craft-muted)]">{item.answer}</dd>
              </div>
            ))}
          </dl>
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
            Seu talento merece ser visto. E valorizado.
          </h2>
          <p className="text-sm text-white/80 sm:text-base">
            Crie seu catálogo gratuitamente — sem cartão de crédito, pronto em poucos minutos.
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
        AteliFácil — catálogo digital para artesãs
      </footer>
    </main>
  );
}
