"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { calculateInstallmentOptions, type PaymentMethod } from "@/lib/pricing/calculate";
import { toCents, toReais } from "@/lib/pricing/money";
import { isPriceVariable, priceLabel, PRICE_VARIATION_NOTICE } from "@/lib/pricing/price-display";
import { InstallmentOptions } from "./installment-options";
import { WhatsappButton } from "./whatsapp-button";
import { SelectionToggleButton } from "./selection-toggle-button";
import type { ProductStatus } from "@/types/database.types";

type Variant = {
  id: string;
  name: string;
  price: number | null;
  status: string;
};

type Props = {
  storeId: string;
  storeName: string;
  storeWhatsapp: string;
  productId: string;
  productName: string;
  productSlug: string;
  productUrl: string;
  status: ProductStatus;
  basePrice: number;
  variants: Variant[];
  coverImageUrl: string | null;
  paymentMethods: PaymentMethod[];
};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Preço, variações e ações da peça, num componente só.
 *
 * Escolher a variação precisa atualizar o preço, o parcelamento, a mensagem do
 * WhatsApp e o que vai para a seleção. Como tudo depende da mesma escolha, o
 * estado vive aqui em vez de espalhado — separado, cada parte mostraria um
 * valor diferente.
 */
export function ProductPurchase({
  storeId,
  storeName,
  storeWhatsapp,
  productId,
  productName,
  productSlug,
  productUrl,
  status,
  basePrice,
  variants,
  coverImageUrl,
  paymentMethods,
}: Props) {
  const sellable = variants.filter((v) => v.status !== "sold_out");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = sellable.find((v) => v.id === selectedId) ?? null;

  // Sem escolha, mostra o menor preço com "a partir de" — o mesmo do card.
  const variantPrices = variants.map((v) => v.price).filter((p): p is number => p != null);
  const lowestPrice = variantPrices.length > 0 ? Math.min(basePrice, ...variantPrices) : basePrice;

  const currentPrice = selected ? (selected.price ?? basePrice) : lowestPrice;
  const showFromPrefix = !selected && variantPrices.length > 0;

  const priceCents = toCents(currentPrice);
  const variable = isPriceVariable(status);

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className={cn("kicker", variable && "text-[var(--gold)]")}>{priceLabel(status)}</span>
        <p className="flex items-baseline gap-2 text-xl">
          {showFromPrefix ? <span className="kicker normal-case">a partir de</span> : null}
          {formatPrice(currentPrice)}
          <span className="text-xs text-muted-foreground">à vista</span>
        </p>
      </div>

      <InstallmentOptions
        cashPriceCents={priceCents}
        options={calculateInstallmentOptions({ cashPriceCents: priceCents, methods: paymentMethods })}
        isFromPrice={showFromPrefix}
      />

      {variable ? (
        <div className="max-w-prose rounded-[var(--radius)] border border-[var(--gold)]/40 bg-[var(--gold)]/[0.07] p-4">
          <p className="text-[0.8125rem] leading-relaxed text-foreground/85">
            {PRICE_VARIATION_NOTICE}
          </p>
        </div>
      ) : null}

      {variants.length > 0 ? (
        <div className="flex flex-col gap-3">
          <span className="kicker">Variações</span>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const soldOut = variant.status === "sold_out";
              const isActive = selectedId === variant.id;
              const extraCents =
                variant.price != null ? toCents(variant.price) - toCents(lowestPrice) : 0;

              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={soldOut}
                  aria-pressed={isActive}
                  // Clicar de novo desmarca: a cliente pode voltar a ver o
                  // "a partir de" sem recarregar a página.
                  onClick={() => setSelectedId(isActive ? null : variant.id)}
                  className={cn(
                    "inline-flex items-baseline gap-1.5 rounded-full border px-4 py-2 text-xs tracking-wide outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    soldOut
                      ? "cursor-not-allowed border-border text-muted-foreground/60 line-through"
                      : isActive
                        ? "border-foreground bg-foreground text-background shadow-sm"
                        : "border-foreground/25 text-foreground hover:border-foreground hover:bg-secondary",
                  )}
                >
                  {variant.name}
                  {extraCents > 0 ? (
                    <span className={isActive ? "text-background/70" : "text-muted-foreground"}>
                      +{formatPrice(toReais(extraCents))}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {sellable.length > 1 && !selected ? (
            <span className="text-xs text-muted-foreground">
              Escolha uma variação para ver o valor exato.
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <WhatsappButton
          storeId={storeId}
          storeName={storeName}
          storeWhatsapp={storeWhatsapp}
          productId={productId}
          productName={productName}
          productUrl={productUrl}
          status={status}
          variantLabel={selected?.name ?? null}
        />
        <SelectionToggleButton
          item={{
            productId,
            slug: productSlug,
            name: productName,
            price: currentPrice,
            priceIsFrom: showFromPrefix,
            status,
            coverImageUrl,
            variantName: selected?.name ?? null,
          }}
        />
      </div>
    </>
  );
}
