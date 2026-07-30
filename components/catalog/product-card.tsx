import Image from "next/image";
import Link from "next/link";
import type { ProductStatus } from "@/types/database.types";

type ProductCardProps = {
  slug: string;
  name: string;
  price: number;
  fromPrice?: boolean;
  status: ProductStatus;
  coverImageUrl: string | null;
  /** Índice na grade — escalona a entrada, criando a cascata editorial. */
  index?: number;
};

const STATUS_BADGE: Record<ProductStatus, string | null> = {
  available: null,
  made_to_order: "Sob encomenda",
  sold_out: "Esgotado",
  inactive: null,
};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProductCard({
  slug,
  name,
  price,
  fromPrice,
  status,
  coverImageUrl,
  index = 0,
}: ProductCardProps) {
  const badge = STATUS_BADGE[status];

  return (
    <Link
      href={`/produtos/${slug}`}
      className="group reveal flex flex-col outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-secondary">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={name}
            fill
            className="object-cover transition-[transform,filter] duration-[900ms] ease-out group-hover:scale-[1.04]"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="kicker">Sem imagem</span>
          </div>
        )}

        {badge ? (
          <span className="absolute left-0 top-4 bg-background/92 px-3 py-1.5 text-[0.625rem] font-medium uppercase tracking-[0.18em] text-foreground backdrop-blur-sm">
            {badge}
          </span>
        ) : null}

        {/* Fio dourado que cresce no hover — o detalhe que assina o card. */}
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-px w-0 bg-[var(--gold)] transition-all duration-500 ease-out group-hover:w-full group-focus-visible:w-full"
        />
      </div>

      <div className="flex flex-col gap-1 pt-4">
        <h3 className="font-[family-name:var(--font-brand)] text-[0.9375rem] leading-snug text-foreground">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {fromPrice ? <span className="kicker mr-1.5 normal-case">a partir de</span> : null}
          {formatPrice(price)}
        </p>
      </div>
    </Link>
  );
}
