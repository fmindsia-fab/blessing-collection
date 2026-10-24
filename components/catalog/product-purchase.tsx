"use client";

import { useEffect, useRef, useState } from "react";
import { InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateInstallmentOptions, type PaymentMethod } from "@/lib/pricing/calculate";
import { toCents, toReais } from "@/lib/pricing/money";
import { isPriceVariable, priceLabel, priceVariationNotice } from "@/lib/pricing/price-display";
import {
  describeSelection,
  groupVariants,
  missingRequiredGroups,
  priceWithVariants,
  variantSurchargeCents,
  type VariantOption,
} from "@/lib/pricing/variants";
import { InstallmentOptions } from "./installment-options";
import { WhatsappButton } from "./whatsapp-button";
import { SelectionToggleButton } from "./selection-toggle-button";
import { ShareButton } from "@/components/shared/share-button";
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
 * item da sacola. Como tudo depende do mesmo estado, ele vive aqui — separado,
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
  // Uma entrada por conjunto de escolha (chave do grupo): {"Cor::complemento": "id-marrom", "Alça::obrigatoria": "id-metal"}.
  const [chosen, setChosen] = useState<Record<string, string>>({});

  const groups = groupVariants(variants);
  const basePriceCents = toCents(basePrice);

  const selected = groups
    .map((group) => group.options.find((option) => option.id === chosen[group.key]))
    .filter((option): option is VariantOption => option != null);

  const currentCents = priceWithVariants(basePriceCents, selected);

  // Enquanto houver grupo por escolher cujas opções têm adicional, o preço
  // ainda pode subir — daí o "a partir de".
  const pendingPricedGroup = groups.some(
    (group) =>
      !chosen[group.key] &&
      group.options.some((option) => variantSurchargeCents(option, basePriceCents) > 0),
  );

  // Escolhas OBRIGATÓRIAS que faltam (ex.: o tipo de alça). Enquanto faltar, não dá para enviar pelo
  // WhatsApp nem pôr na sacola, porque a loja precisa saber qual opção a cliente quer. Em peça
  // esgotada o botão é só uma consulta, então não exige escolha.
  const missingRequired = status === "sold_out" ? [] : missingRequiredGroups(groups, chosen);
  const missingNames = missingRequired.map((group) => group.name).join(", ");
  const disabledReason = missingRequired.length > 0 ? `Escolha primeiro: ${missingNames}` : undefined;

  const variable = isPriceVariable(status);
  const selectionLabel = describeSelection(selected);

  // Barra fixa (só no celular) com preço e botão do WhatsApp: aparece quando os botões da
  // própria página saem da tela, e some quando eles voltam ou quando se chega ao rodapé.
  const actionsRef = useRef<HTMLDivElement>(null);
  const [actionsVisible, setActionsVisible] = useState(true);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const actions = actionsRef.current;
    if (!actions || typeof IntersectionObserver === "undefined") return;

    const actionsObserver = new IntersectionObserver(([entry]) => setActionsVisible(entry.isIntersecting));
    actionsObserver.observe(actions);

    const footer = document.querySelector("footer");
    const footerObserver = footer
      ? new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting))
      : null;
    if (footer) footerObserver?.observe(footer);

    return () => {
      actionsObserver.disconnect();
      footerObserver?.disconnect();
    };
  }, []);

  const showStickyBar = !actionsVisible && !footerVisible;

  function choose(groupKey: string, optionId: string, required: boolean) {
    setChosen((current) => {
      // Clicar na opção ativa desmarca, para a cliente voltar atrás sem recarregar a página.
      // Na escolha obrigatória não desmarca: só troca por outra opção.
      if (current[groupKey] === optionId) {
        if (required) return current;
        const rest = { ...current };
        delete rest[groupKey];
        return rest;
      }
      return { ...current, [groupKey]: optionId };
    });
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className={cn("kicker", variable && "font-semibold tracking-[0.16em] text-[var(--gold-text,var(--gold))]")}>
          {priceLabel(status)}
        </span>
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
        <details className="group max-w-prose rounded-[var(--radius)] border border-[var(--gold)]/70 bg-[var(--gold)]/[0.14] px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center gap-2.5 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] [&::-webkit-details-marker]:hidden">
            <InfoIcon className="size-4 shrink-0 text-[var(--gold-text,var(--gold))]" aria-hidden />
            Peça sob encomenda: o valor pode variar
            <span className="ml-auto text-xs underline underline-offset-4 group-open:hidden">Saiba mais</span>
          </summary>
          <p className="pt-2 text-[0.8125rem] leading-relaxed text-foreground">{priceVariationNotice(storeName)}</p>
        </details>
      ) : null}

      {groups.length > 0 ? (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.key} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="kicker">{group.label}</span>
                {group.required ? (
                  <span className="text-xs font-medium text-[var(--gold-text,var(--gold))]">Escolha uma opção</span>
                ) : group.label.endsWith("complementos") ? (
                  <span className="text-xs text-muted-foreground">Opcional</span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.options.map((option) => {
                  const soldOut = option.status === "sold_out";
                  const isActive = chosen[group.key] === option.id;
                  const surcharge = variantSurchargeCents(option, basePriceCents);

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={soldOut}
                      aria-pressed={isActive}
                      onClick={() => choose(group.key, option.id, group.required)}
                      className={cn(
                        "inline-flex items-baseline gap-1.5 rounded-full border px-4 py-2 text-xs tracking-wide outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        soldOut
                          ? "cursor-not-allowed border-border text-muted-foreground/60 line-through"
                          : isActive
                            ? "border-foreground bg-foreground text-background shadow-sm"
                            : "border-foreground/25 text-foreground hover:border-foreground hover:bg-secondary",
                      )}
                    >
                      {option.color_hex ? (
                        <span
                          aria-hidden
                          className={cn(
                            "size-4 shrink-0 self-center rounded-full border",
                            isActive ? "border-background/60" : "border-foreground/20",
                            soldOut && "opacity-50",
                          )}
                          style={
                            option.color_hex_secondary
                              ? {
                                  background: `linear-gradient(135deg, ${option.color_hex} 50%, ${option.color_hex_secondary} 50%)`,
                                }
                              : { backgroundColor: option.color_hex }
                          }
                        />
                      ) : null}
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

          {missingRequired.length > 0 ? (
            <span role="status" className="text-sm leading-relaxed text-muted-foreground">
              Para continuar, escolha: <strong className="font-medium text-foreground">{missingNames}</strong>.{" "}
              {pendingPricedGroup ? "O valor muda conforme a opção." : "A loja precisa saber qual você quer."}
            </span>
          ) : null}
        </div>
      ) : null}

      <div ref={actionsRef} className="flex flex-wrap gap-3 pt-2">
        <WhatsappButton
          storeId={storeId}
          storeName={storeName}
          storeWhatsapp={storeWhatsapp}
          productId={productId}
          productName={productName}
          productUrl={productUrl}
          status={status}
          variantLabel={selectionLabel}
          disabledReason={disabledReason}
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
          disabledReason={disabledReason}
        />
        <ShareButton
          url={productUrl}
          title={productName}
          message={`Olha essa ${productName}${selectionLabel ? ` (${selectionLabel})` : ""} que eu encontrei!`}
          label="Compartilhar"
          variant="outline"
        />
      </div>

      {/* Barra fixa do celular: preço atual + botão do WhatsApp sempre à mão. */}
      <div
        aria-hidden={!showStickyBar}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_oklch(0.25_0.02_45/0.25)] backdrop-blur transition-transform duration-300 motion-reduce:transition-none lg:hidden",
          showStickyBar ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
      >
        <p className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-xs text-muted-foreground">
            {missingRequired.length > 0 ? `Escolha: ${missingNames}` : pendingPricedGroup ? "a partir de" : "à vista"}
          </span>
          <span className="text-lg font-medium">{formatPrice(toReais(currentCents))}</span>
        </p>
        <WhatsappButton
          storeId={storeId}
          storeName={storeName}
          storeWhatsapp={storeWhatsapp}
          productId={productId}
          productName={productName}
          productUrl={productUrl}
          status={status}
          variantLabel={selectionLabel}
          className="h-11 shrink-0 px-5"
          tabIndex={showStickyBar ? 0 : -1}
          disabledReason={disabledReason}
        />
      </div>
    </>
  );
}
