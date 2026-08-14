"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { calculateInstallmentOptions, type PaymentMethod } from "@/lib/pricing/calculate";
import { toCents, toReais } from "@/lib/pricing/money";
import { isPriceVariable, priceLabel, PRICE_VARIATION_NOTICE } from "@/lib/pricing/price-display";
import {
  describeSelection,
  groupVariants,
  priceWithVariants,
  variantSurchargeCents,
  type VariantOption,
} from "@/lib/pricing/variants";
import { InstallmentOptions } from "./installment-options";
import { WhatsappButton } from "./whatsapp-button";
import { SelectionToggleButton } from "./selection-toggle-button";
import type { ProductStatus } from "@/types/database.types";

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
  variants: VariantOption[];
  coverImageUrl: string | null;
  paymentMethods: PaymentMethod[];
};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Preço, variações e ações da peça, num componente só.
 *
 * As escolhas atualizam o preço, o parcelamento, a mensagem do WhatsApp e o
 * item da seleção. Como tudo depende do mesmo estado, ele vive aqui — separado,
 * cada parte mostraria um valor diferente.
 *
 * Uma escolha por grupo, várias no total: cor e alça convivem, duas cores não.
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
  // Uma entrada por grupo: {"Cor": "id-marrom", "Alça": "id-corrente"}.
  const [chosen, setChosen] = useState<Record<string, string>>({});

  const groups = groupVariants(variants);
  const basePriceCents = toCents(basePrice);

  const selected = groups
    .map((group) => group.options.find((option) => option.id === chosen[group.name]))
    .filter((option): option is VariantOption => option != null);

  const currentCents = priceWithVariants(basePriceCents, selected);

  // Enquanto houver grupo por escolher cujas opções têm adicional, o preço
  // ainda pode subir — daí o "a partir de".
  const pendingPricedGroup = groups.some(
    (group) =>
      !chosen[group.name] &&
      group.options.some((option) => variantSurchargeCents(option, basePriceCents) > 0),
  );

  const variable = isPriceVariable(status);
  const selectionLabel = describeSelection(selected);

  function choose(groupName: string, optionId: string) {
    setChosen((current) => {
      // Clicar na opção ativa desmarca, para a cliente voltar atrás sem
      // recarregar a página.
      if (current[groupName] === optionId) {
        const rest = { ...current };
        delete rest[groupName];
        return rest;
      }
      return { ...current, [groupName]: optionId };
    });
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className={cn("kicker", variable && "text-[var(--gold)]")}>{priceLabel(status)}</span>
        <p className="flex items-baseline gap-2 text-xl">
          {pendingPricedGroup ? <span className="kicker normal-case">a partir de</span> : null}
          {formatPrice(toReais(currentCents))}
          <span className="text-xs text-muted-foreground">à vista</span>
        </p>
      </div>

      <InstallmentOptions
        cashPriceCents={currentCents}
        options={calculateInstallmentOptions({
          cashPriceCents: currentCents,
          methods: paymentMethods,
        })}
        isFromPrice={pendingPricedGroup}
      />

      {variable ? (
        <div className="max-w-prose rounded-[var(--radius)] border border-[var(--gold)]/40 bg-[var(--gold)]/[0.07] p-4">
          <p className="text-[0.8125rem] leading-relaxed text-foreground/85">
            {PRICE_VARIATION_NOTICE}
          </p>
        </div>
      ) : null}

      {groups.length > 0 ? (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.name} className="flex flex-col gap-3">
              <span className="kicker">{group.name}</span>
              <div className="flex flex-wrap gap-2">
                {group.options.map((option) => {
                  const soldOut = option.status === "sold_out";
                  const isActive = chosen[group.name] === option.id;
                  const surcharge = variantSurchargeCents(option, basePriceCents);

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={soldOut}
                      aria-pressed={isActive}
                      onClick={() => choose(group.name, option.id)}
                      className={cn(
                        "inline-flex items-baseline gap-1.5 rounded-full border px-4 py-2 text-xs tracking-wide outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        soldOut
                          ? "cursor-not-allowed border-border text-muted-foreground/60 line-through"
                          : isActive
                            ? "border-foreground bg-foreground text-background shadow-sm"
                            : "border-foreground/25 text-foreground hover:border-foreground hover:bg-secondary",
                      )}
                    >
                      {option.name}
                      {surcharge > 0 ? (
                        <span className={isActive ? "text-background/70" : "text-muted-foreground"}>
                          +{formatPrice(toReais(surcharge))}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {pendingPricedGroup ? (
            <span className="text-xs text-muted-foreground">
              Escolha as opções para ver o valor exato.
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
          variantLabel={selectionLabel}
        />
        <SelectionToggleButton
          item={{
            productId,
            slug: productSlug,
            name: productName,
            price: toReais(currentCents),
            priceIsFrom: pendingPricedGroup,
            status,
            coverImageUrl,
            variantName: selectionLabel,
          }}
        />
      </div>
    </>
  );
}
