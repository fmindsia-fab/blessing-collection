import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Arrow } from "./arrow";

/**
 * Vocabulário único de ações do catálogo. Antes as mesmas ~8 classes eram
 * repetidas em 11 lugares, então cada tela divergia aos poucos (alturas 11/12,
 * tracking 0.16/0.18, hover ora dourado ora não).
 *
 * Foco visível é obrigatório: o anel usa offset para não sumir sobre o CTA
 * sólido escuro (critério de acessibilidade do PRD seção 15).
 */
const actionVariants = cva(
  "group inline-flex items-center justify-center gap-2.5 whitespace-nowrap text-[0.6875rem] uppercase tracking-[0.18em] transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        /** CTA principal: sólido escuro que vira dourado. */
        solid: "h-12 bg-foreground px-8 text-background hover:bg-[var(--gold)]",
        /** Ação secundária: contorno que preenche no hover. */
        outline:
          "h-12 border border-foreground px-8 text-foreground hover:bg-foreground hover:text-background",
        /** Terciária: contorno leve, para o que não deve competir. */
        quiet:
          "h-12 border border-border px-6 text-muted-foreground hover:border-foreground hover:text-foreground",
        /** Link editorial: fio embaixo, sem caixa. */
        underline:
          "border-b border-foreground pb-1.5 text-foreground hover:border-[var(--gold)] hover:text-[var(--gold)]",
        /** Link discreto: sem fio, só cor. */
        ghost: "text-muted-foreground hover:text-foreground",
      },
    },
    defaultVariants: { variant: "solid" },
  },
);

type ActionProps = VariantProps<typeof actionVariants> & {
  className?: string;
  children: React.ReactNode;
  /** Acrescenta a seta traçada, que se estende no hover. */
  arrow?: boolean;
};

export function ActionLink({
  href,
  variant,
  className,
  children,
  arrow,
  external,
  ...props
}: ActionProps & {
  href: string;
  external?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      {children}
      {arrow ? <Arrow /> : null}
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(actionVariants({ variant }), className)}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={cn(actionVariants({ variant }), className)} {...props}>
      {content}
    </Link>
  );
}

export function ActionButton({
  variant,
  className,
  children,
  arrow,
  ...props
}: ActionProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(actionVariants({ variant }), className)} {...props}>
      {children}
      {arrow ? <Arrow /> : null}
    </button>
  );
}

export { actionVariants };
