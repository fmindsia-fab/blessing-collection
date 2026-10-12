import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
 * Design neutro do painel administrativo (não mais a estética editorial do
 * catálogo): tipografia normal em vez de versalete espaçado, tamanhos de
 * fonte legíveis (texto corrido, não caixa alta reduzida), cantos
 * levemente arredondados, foco com o acento indigo/violeta da plataforma
 * (--gold, redefinido em lib/store/admin-theme.ts). Os nomes das variantes
 * e tamanhos são os mesmos do shadcn para não quebrar os 32 arquivos do
 * painel que já usam este Button.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[var(--gold)] text-primary-foreground shadow-sm hover:opacity-90 hover:shadow-md",
        outline:
          "border-foreground/25 bg-transparent text-foreground hover:border-foreground hover:bg-accent",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:border-foreground/25 hover:bg-accent",
        ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
        destructive:
          "border-destructive/25 text-destructive hover:border-destructive hover:bg-destructive hover:text-background",
        link: "text-foreground underline underline-offset-4 hover:text-[var(--gold)]",
      },
      size: {
        default: "h-11 gap-2 px-6 text-sm",
        xs: "h-8 gap-1.5 px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-9 gap-1.5 px-4 text-sm",
        lg: "h-12 gap-2.5 px-8 text-base",
        icon: "size-11",
        "icon-xs": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
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
