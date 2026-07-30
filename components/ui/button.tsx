import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
 * Alinhado à estética editorial do catálogo: cantos quase retos (herdados de
 * --radius), versalete espaçado no lugar do peso semibold, alturas maiores e
 * foco dourado visível. Os nomes das variantes e tamanhos são os mesmos do
 * shadcn para não quebrar os 12 arquivos do painel que já usam este Button.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding whitespace-nowrap uppercase tracking-[0.14em] transition-all duration-300 outline-none select-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background shadow-sm hover:bg-[var(--gold)] hover:shadow-md",
        outline:
          "border-foreground/30 bg-transparent text-foreground hover:border-foreground hover:bg-foreground hover:text-background",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:border-foreground/30 hover:bg-accent",
        ghost: "text-muted-foreground hover:text-foreground",
        destructive:
          "border-destructive/25 text-destructive hover:border-destructive hover:bg-destructive hover:text-background",
        link: "tracking-normal text-foreground normal-case underline underline-offset-4 hover:text-[var(--gold)]",
      },
      size: {
        default: "h-11 gap-2 px-6 text-[0.6875rem]",
        xs: "h-8 gap-1.5 px-3 text-[0.625rem] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 text-[0.625rem]",
        lg: "h-12 gap-2.5 px-8 text-[0.6875rem]",
        icon: "size-11",
        "icon-xs": "size-8 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
