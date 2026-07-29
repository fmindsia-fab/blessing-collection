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
};

const STATUS_BADGE: Record<ProductStatus, { label: string; className: string } | null> = {
  available: null,
  made_to_order: { label: "Sob encomenda", className: "bg-amber-100 text-amber-900" },
  sold_out: { label: "Esgotado", className: "bg-zinc-200 text-zinc-700" },
  inactive: null,
};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProductCard({ slug, name, price, fromPrice, status, coverImageUrl }: ProductCardProps) {
  const badge = STATUS_BADGE[status];

  return (
    <Link href={`/produtos/${slug}`} className="group flex flex-col gap-3">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-zinc-100">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : null}
        {badge ? (
          <span
            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-zinc-900">{name}</h3>
        <p className="text-sm text-zinc-600">
          {fromPrice ? "A partir de " : ""}
          {formatPrice(price)}
        </p>
      </div>
    </Link>
  );
}
