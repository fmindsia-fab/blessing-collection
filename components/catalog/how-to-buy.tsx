import { CheckCircle2Icon, MessageCircleIcon, ShoppingBagIcon } from "lucide-react";

// "Como comprar": três passos curtos para quem chega pela primeira vez. Descreve só o que o site
// realmente faz: não há pagamento no site, a compra se combina pelo WhatsApp da loja.
const STEPS = [
  {
    icon: ShoppingBagIcon,
    title: "Escolha suas peças",
    text: "Veja o catálogo, abra as peças de que gostou e escolha cor e opções. Toque em Adicionar à sacola.",
  },
  {
    icon: MessageCircleIcon,
    title: "Envie pelo WhatsApp",
    text: "Um toque e a conversa já abre com as peças e as opções que você escolheu, sem precisar explicar tudo de novo.",
  },
  {
    icon: CheckCircle2Icon,
    title: "Combine com a loja",
    text: "Valores, prazo, forma de pagamento e entrega são combinados direto na conversa.",
  },
] as const;

export function HowToBuy() {
  return (
    <section aria-labelledby="como-comprar" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="kicker">Passo a passo</span>
        <h2 id="como-comprar" className="font-[family-name:var(--font-brand)] text-2xl tracking-tight sm:text-[1.75rem]">
          Como comprar
        </h2>
      </div>

      <ol className="grid gap-4 sm:grid-cols-3 sm:gap-6">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="flex flex-col items-center gap-3 rounded-[var(--radius-image)] border border-border bg-card px-6 py-7 text-center shadow-sm"
          >
            <span
              aria-hidden
              className="flex size-12 items-center justify-center rounded-full bg-[var(--gold)]/12 text-[var(--gold)]"
            >
              <step.icon className="size-6" />
            </span>
            <h3 className="text-base font-medium">
              <span className="sr-only">Passo {index + 1}: </span>
              {step.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
