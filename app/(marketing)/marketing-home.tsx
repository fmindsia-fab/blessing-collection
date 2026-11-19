import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, CalculatorIcon, ClipboardListIcon } from "lucide-react";
import { PALETTE_VARS } from "./craft-palette";
import { YarnSkein, StitchWave, YarnTangle, YarnBall, CrochetHooks } from "./craft-motifs";

// Foto de uma artesã trabalhando, com o catálogo de bolsas visível no
// laptop/tablet ao fundo — fornecida pelo usuário.
const HERO_PHOTO_URL = "/marketing/hero-produto.jpg";

// Print do catálogo real da Blessing Collection no celular. É o pôster 941x1672 de
// "vitrine-catalogo-real.jpg"; o hero recorta só o celular (CatalogPhone).
const HERO_PHONE_URL = "/marketing/vitrine-catalogo-real.jpg";

// Rotas e oferta num lugar só: o topo, o meio, a FAQ e o rodapé repetem estes valores.
const SIGNUP_HREF = "/cadastro";
const REAL_CATALOG_URL = "https://blessingcollection.com.br";
const TRIAL_CTA_LABEL = "Testar grátis por 30 dias";
const MONTHLY_PRICE = "R$ 69,90";

// "Por dentro do AteliFácil": o destaque é o catálogo no celular (print real) e, ao lado,
// encomendas e precificação em texto curto — ainda não há prints dessas telas sem dados
// de clientes. Os pôsteres restantes ficam recolhidos em "Ver mais da vitrine".
const FEATURED_CATALOG = {
  url: "/marketing/vitrine-peca.jpg",
  alt: "Página de uma peça no celular, com galeria de fotos, nome, valor de referência e a informação de sob encomenda",
  title: "Catálogo no celular",
  text: "Suas peças com fotos, nome, preço e se são de pronta entrega ou sob encomenda, numa vitrine com a cara do seu ateliê.",
};

const FEATURED_TOOLS = [
  {
    icon: ClipboardListIcon,
    title: "Encomendas organizadas",
    text: "Cada pedido com prazo, personalização e sinal registrados, num quadro por etapa: orçamento, confirmado, em produção, pronto e entregue.",
  },
  {
    icon: CalculatorIcon,
    title: "Saiba quanto cobrar",
    text: "Informe materiais, horas e custos fixos e veja o preço sugerido da peça. A taxa do cartão é repassada, então você recebe o mesmo valor no Pix e em cada parcela.",
  },
];

const SHOWCASE_CARDS = [
  {
    url: "/marketing/vitrine-categorias.jpg",
    alt: "Seção de categorias do catálogo: Bolsas, Acessórios, Organizadores e Kits e Presentes",
    title: "Separe seus produtos por categorias",
    text: "Bolsas, acessórios, kits e o que mais você fizer: seu catálogo fica mais claro e fácil de navegar.",
  },
  {
    url: "/marketing/vitrine-lancamentos.jpg",
    alt: "Seção de lançamentos do catálogo, com as peças recém-chegadas",
    title: "Destaque lançamentos e novidades",
    text: "Mostre as peças recém-chegadas na página inicial e mantenha seu catálogo sempre atualizado.",
  },
  {
    url: "/marketing/vitrine-busca-filtros.jpg",
    alt: "Página de peças do catálogo com busca por nome e filtros de categoria, modelo, cor e disponibilidade",
    title: "Busca e filtros para a cliente",
    text: "Ela busca pelo nome e filtra por categoria, modelo, cor e disponibilidade para achar a peça ideal mais rápido.",
  },
  {
    url: "/marketing/vitrine-compartilhar.jpg",
    alt: "Rodapé do catálogo com botões de WhatsApp, Instagram e Compartilhar",
    title: "Compartilhe sua vitrine com facilidade",
    text: "WhatsApp, Instagram e um botão de compartilhar: mande o link onde quiser e receba os pedidos.",
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
    question: "Quanto custa o AteliFácil depois do teste?",
    answer: `Você pode testar o AteliFácil por 30 dias sem cadastrar cartão. Depois do teste, a assinatura custa ${MONTHLY_PRICE} por mês. Você só paga se decidir assinar.`,
  },
  {
    question: "O que acontece com meu catálogo se eu não assinar?",
    answer:
      "Ao fim dos 30 dias, o catálogo deixa de aparecer para as clientes (quem acessar vê um aviso) e nenhuma cobrança é feita. Você continua entrando no painel, seus dados não são apagados automaticamente e o catálogo volta ao ar quando você assinar.",
  },
  {
    question: "O AteliFácil cobra comissão por venda?",
    answer: `Não. Você paga só a assinatura de ${MONTHLY_PRICE} por mês, depois do teste. A negociação e o pagamento acontecem direto entre você e a cliente, pelo seu WhatsApp — o que você vende é seu.`,
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


// CTA principal — maior, com ícone de seta e leve "respiração" (animate-pulse
// no halo), para ficar impossível de ignorar. Repetido 3x na página
// (hero, meio, final) de propósito: cada seção reforça o convite.
function PrimaryCta({ className, label = TRIAL_CTA_LABEL }: { className?: string; label?: string }) {
  return (
    <Link
      href={SIGNUP_HREF}
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

function SecondaryCta({ className }: { className?: string }) {
  return (
    <Link
      href={REAL_CATALOG_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex h-14 items-center justify-center rounded-full border border-[var(--craft-terracotta)]/50 bg-[var(--craft-card)] px-8 text-sm font-semibold tracking-wide text-[var(--craft-terracotta)] outline-none transition-all duration-300 hover:border-[var(--craft-terracotta)] hover:bg-[var(--craft-bg-warm)] focus-visible:ring-2 focus-visible:ring-[var(--craft-terracotta)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--craft-bg)] ${className ?? ""}`}
    >
      Ver catálogo real
    </Link>
  );
}

// Recorta só o celular do pôster 941x1672 (região x 195-905, y 255-1355), para o print
// do catálogo ficar grande o bastante para ler o nome da loja, a peça e o preço.
function CatalogPhone({ className }: { className?: string }) {
  return (
    <div
      className={`relative aspect-[710/1100] overflow-hidden rounded-[var(--radius-image)] bg-[var(--craft-card)] shadow-2xl ring-1 ring-[var(--craft-border)] ${className ?? ""}`}
    >
      <Image
        src={HERO_PHONE_URL}
        alt="Catálogo real da Blessing Collection no celular: logo da loja, a bolsa Valentina em sob encomenda e o valor de referência de R$ 379,90"
        width={941}
        height={1672}
        priority
        sizes="(min-width: 1024px) 280px, 240px"
        className="absolute max-w-none"
        style={{ width: "132.54%", left: "-27.46%", top: "-23.2%" }}
      />
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
      <header className="px-6 pt-5 pb-1 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-base font-semibold text-[var(--craft-muted)] underline-offset-4 outline-none transition-colors hover:text-[var(--craft-ink)] hover:underline focus-visible:text-[var(--craft-ink)] focus-visible:underline"
            >
              Entrar
            </Link>
            <Link
              href={SIGNUP_HREF}
              className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--craft-terracotta)] px-7 text-base font-semibold text-[var(--craft-bg)] shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-[var(--craft-terracotta)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--craft-bg)]"
            >
              Testar grátis
            </Link>
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
            <h1 className="font-[family-name:var(--font-brand)] text-[2rem] leading-[1.1] tracking-tight sm:text-5xl lg:text-[3rem]">
              Mostre suas peças.
              <br />
              Organize suas encomendas.
              <br />
              <span className="italic text-[var(--craft-terracotta)]">Saiba quanto cobrar.</span>
            </h1>
            <p className="max-w-md text-pretty text-base leading-relaxed text-[var(--craft-muted)] sm:text-lg">
              Crie um catálogo com a cara do seu ateliê, receba pedidos pelo WhatsApp e calcule o
              preço das suas peças com base nos seus custos.
            </p>
            <div className="mt-1 flex flex-col items-center gap-4 lg:items-start">
              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <PrimaryCta />
                <SecondaryCta />
              </div>
              <p className="max-w-sm text-pretty text-sm font-medium leading-relaxed text-[var(--craft-ink)] sm:max-w-none sm:text-base">
                30 dias grátis, sem cartão. Depois, {MONTHLY_PRICE} por mês se você decidir assinar.
              </p>
            </div>
          </div>

          {/* Celular: o print vem abaixo da foto, sem cobri-la, para ficar legível.
              Desktop: o print se sobrepõe ao canto inferior direito da foto. */}
          <div className="relative mx-auto flex w-full max-w-sm flex-col items-center lg:mx-0 lg:block lg:max-w-none lg:pb-10">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-image)] bg-[var(--craft-card)] shadow-xl ring-1 ring-[var(--craft-border)] lg:w-[88%]">
              <Image
                src={HERO_PHOTO_URL}
                alt="Artesã produzindo uma bolsa de crochê, com o catálogo de produtos visível no notebook"
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 40vw, 90vw"
              />
            </div>
            <CatalogPhone className="relative z-10 -mt-14 w-60 lg:absolute lg:right-0 lg:bottom-0 lg:mt-0 lg:w-[280px]" />
          </div>
        </div>
      </section>

      {/* Por dentro do AteliFácil — três exemplos do dia a dia: o catálogo no celular
          (print real), encomendas e precificação (texto curto, até haver prints sem
          dados de clientes). */}
      <section className="relative overflow-hidden px-6 pb-16 lg:px-10">
        <CrochetHooks className="pointer-events-none absolute -top-2 right-[6%] hidden w-16 text-[var(--craft-terracotta)]/35 md:block" />
        <div className="mx-auto flex max-w-5xl flex-col gap-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-[var(--craft-terracotta)]">
              Por dentro do AteliFácil
            </span>
            <h2 className="font-[family-name:var(--font-brand)] text-3xl tracking-tight sm:text-4xl">
              O que você usa no dia a dia
            </h2>
            <p className="max-w-xl text-pretty text-base leading-relaxed text-[var(--craft-muted)]">
              Um catálogo para suas clientes, as encomendas organizadas e ajuda para precificar,
              tudo no mesmo lugar.
            </p>
          </div>

          <div className="grid items-center gap-8 md:grid-cols-[minmax(0,19rem)_1fr] md:gap-12">
            <div className="mx-auto flex w-full max-w-xs flex-col gap-4 md:mx-0">
              <div className="relative aspect-[941/1672] w-full overflow-hidden rounded-[var(--radius-image)] border border-[var(--craft-border)] bg-[var(--craft-card)] shadow-sm">
                <Image
                  src={FEATURED_CATALOG.url}
                  alt={FEATURED_CATALOG.alt}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 19rem, 80vw"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-medium">{FEATURED_CATALOG.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--craft-muted)]">{FEATURED_CATALOG.text}</p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {FEATURED_TOOLS.map((tool) => (
                <div
                  key={tool.title}
                  className="flex flex-col gap-3 rounded-[var(--radius-image)] border border-[var(--craft-border)] bg-[var(--craft-card)] p-7 shadow-sm"
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-full bg-[var(--craft-bg-warm)] text-[var(--craft-terracotta)]">
                    <tool.icon className="size-5" />
                  </span>
                  <h3 className="text-lg font-medium">{tool.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--craft-muted)] sm:text-base">{tool.text}</p>
                </div>
              ))}
            </div>
          </div>

          <details className="group mx-auto w-full">
            <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-2 text-sm font-medium text-[var(--craft-terracotta)] underline-offset-4 outline-none hover:underline focus-visible:underline [&::-webkit-details-marker]:hidden">
              Ver mais da vitrine
            </summary>
            {/* Celular: carrossel deslizante (cada pôster é alto). Telas maiores: grade. */}
            <div className="-mx-6 mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0">
              {SHOWCASE_CARDS.map((card) => (
                <div key={card.title} className="flex w-[70%] shrink-0 snap-center flex-col gap-4 sm:w-auto">
                  <div className="relative aspect-[941/1672] w-full overflow-hidden rounded-[var(--radius-image)] border border-[var(--craft-border)] bg-[var(--craft-card)] shadow-sm">
                    <Image
                      src={card.url}
                      alt={card.alt}
                      fill
                      className="object-cover"
                      sizes="(min-width: 640px) 22vw, 70vw"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-base font-medium">{card.title}</h3>
                    <p className="text-sm leading-relaxed text-[var(--craft-muted)]">{card.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      </section>

      {/* Prova social — depoimento real da Cris, da Blessing Collection. A
          citação e a assinatura já vêm embutidas na própria arte da foto. */}
      <section className="relative overflow-hidden border-y border-[var(--craft-border)] bg-[var(--craft-bg-warm)] px-6 py-16 lg:px-10">
        <YarnTangle className="pointer-events-none absolute -top-10 right-[8%] hidden w-28 text-[var(--craft-terracotta)]/25 md:block" />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
          <span className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-[var(--craft-terracotta)]">
            Quem já usa no dia a dia
          </span>
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
            href={REAL_CATALOG_URL}
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
            <div className="flex flex-col items-center gap-3 text-center">
              <PrimaryCta />
              <p className="text-sm font-medium">
                30 dias grátis, sem cartão. Depois, {MONTHLY_PRICE} por mês se você decidir assinar.
              </p>
            </div>
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

      {/* CTA final — maior destaque, foto de fundo (mãos trabalhando em
          crochê) com overlay terracota para manter o texto branco legível,
          fechando a página com urgência visual diferente do resto. */}
      <section className="relative overflow-hidden bg-[var(--craft-terracotta)] px-6 py-24 text-[var(--craft-bg)] lg:px-10">
        <Image
          src="/marketing/cta-background.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div aria-hidden className="absolute inset-0 bg-[var(--craft-terracotta)]/80" />
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
          <p className="text-sm text-white/90 sm:text-base">
            30 dias grátis, sem cartão. Depois, {MONTHLY_PRICE} por mês se você decidir assinar.
          </p>
          <Link
            href={SIGNUP_HREF}
            className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-white px-9 text-sm font-semibold tracking-wide text-[var(--craft-terracotta)] shadow-lg outline-none transition-all duration-300 hover:scale-[1.03] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--craft-terracotta)]"
          >
            {TRIAL_CTA_LABEL}
            <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <footer className="flex flex-col items-center gap-3 border-t border-[var(--craft-border)] px-6 py-10 text-center text-base text-[var(--craft-muted)] lg:px-10">
        <span className="font-medium">AteliFácil — catálogo digital para artesãs</span>
        <span>
          Desenvolvido por FMinds — Suporte:{" "}
          <Link
            href="https://wa.me/5543991434124?text=Oi%2C%20vi%20o%20AteliF%C3%A1cil%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es."
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--craft-terracotta)] underline underline-offset-4 outline-none transition-colors hover:text-[var(--craft-ink)] focus-visible:text-[var(--craft-ink)]"
          >
            (43) 99143-4124 (WhatsApp) — Fabio Marcelo
          </Link>
        </span>
        <nav aria-label="Documentos legais" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm">
          <Link
            href="/termos"
            className="underline underline-offset-4 outline-none transition-colors hover:text-[var(--craft-ink)] focus-visible:text-[var(--craft-ink)]"
          >
            Termos de Uso
          </Link>
          <Link
            href="/privacidade"
            className="underline underline-offset-4 outline-none transition-colors hover:text-[var(--craft-ink)] focus-visible:text-[var(--craft-ink)]"
          >
            Política de Privacidade
          </Link>
        </nav>
      </footer>
    </main>
  );
}
