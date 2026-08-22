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
  /** Alvo de rolagem do "Carregar mais", para não voltar ao topo. */
  anchorId?: string;
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
  anchorId,
}: ProductCardProps) {
  const badge = STATUS_BADGE[status];

  return (
    <Link
      id={anchorId}
      href={`/produtos/${slug}`}
      className="group reveal flex scroll-mt-24 flex-col outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-image)] bg-secondary shadow-sm transition-shadow duration-500 group-hover:shadow-lg">
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
          <span className="absolute left-2.5 top-2.5 rounded-full bg-background/92 px-2.5 py-1 text-[0.5625rem] font-medium uppercase tracking-[0.08em] text-foreground shadow-sm backdrop-blur-sm">
            {badge}
          </span>
        ) : null}

        {/* Véu + selo revelados no hover: substitui o fio, que não assentava
            bem no canto arredondado. */}
        <span
          aria-hidden
          className="absolute inset-0 bg-foreground/0 transition-colors duration-500 group-hover:bg-foreground/10"
        />
        <span
          aria-hidden
          className="absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-3 rounded-full bg-background/95 px-4 py-2 text-[0.625rem] uppercase tracking-[0.16em] text-foreground opacity-0 shadow-md backdrop-blur-sm transition-all duration-400 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
        >
          Ver peça
        </span>
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
