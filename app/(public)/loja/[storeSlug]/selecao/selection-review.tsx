"use client";

import Image from "next/image";
import Link from "next/link";
import { XIcon } from "lucide-react";
import { useSelection } from "@/lib/selection/selection-context";
import { track } from "@/lib/analytics/track";
import { buildSelectionWhatsappMessage, buildWhatsappLink } from "@/lib/whatsapp/build-message";
import { isPriceVariable, PRICE_VARIATION_NOTICE } from "@/lib/pricing/price-display";
import { ActionButton, ActionLink } from "@/components/ui/action";

type SelectionReviewProps = {
  storeId: string;
  storeSlug: string;
  storeName: string;
  storeWhatsapp: string;
  siteUrl: string;
};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function SelectionReview({ storeId, storeSlug, storeName, storeWhatsapp, siteUrl }: SelectionReviewProps) {
  const { items, remove, clear, isHydrated } = useSelection();

  if (!isHydrated) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-5 py-16">
        <p className="font-[family-name:var(--font-brand)] text-xl text-muted-foreground">
          Você ainda não escolheu nenhuma peça.
        </p>
        <ActionLink href={`/loja/${storeSlug}/produtos`} variant="outline">
          Ver o catálogo
        </ActionLink>
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + item.price, 0);
  // Se alguma peça tem variante com preço próprio, o total é um piso, não o valor final.
  const totalIsFrom = items.some((item) => item.priceIsFrom);
  const hasMadeToOrder = items.some((item) => item.status && isPriceVariable(item.status));

  const message = buildSelectionWhatsappMessage(
    storeName,
    items.map((item) => ({
      name: item.name,
      url: `${siteUrl}/loja/${storeSlug}/produtos/${item.slug}`,
      status: item.status,
      variantName: item.variantName,
    })),
  );
  const whatsappHref = buildWhatsappLink(storeWhatsapp, message);

  function handleSend() {
    // Um evento por produto: mantém o ranking de interesse por peça correto.
    items.forEach((item) => track({ storeId, eventType: "whatsapp_click", productId: item.productId }));
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col divide-y divide-border border-y border-border">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-5 py-5">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-[var(--radius)] bg-secondary shadow-sm">
              {item.coverImageUrl ? (
                <Image src={item.coverImageUrl} alt={item.name} fill className="object-cover" sizes="80px" />
              ) : null}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <Link
                href={`/loja/${storeSlug}/produtos/${item.slug}`}
                className="font-[family-name:var(--font-brand)] text-base transition-colors hover:text-[var(--gold)]"
              >
                {item.name}
              </Link>
              <span className="text-sm text-muted-foreground">
                {item.priceIsFrom ? "a partir de " : ""}
                {formatPrice(item.price)}
              </span>
              {item.status && item.status !== "available" ? (
                <span className="kicker text-[var(--gold)]">
                  {item.status === "sold_out" ? "Esgotada" : "Sob encomenda"}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => remove(item.productId)}
              aria-label={`Remover ${item.name} da seleção`}
              className="p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className="kicker">
          {items.length} {items.length === 1 ? "peça selecionada" : "peças selecionadas"}
        </span>
        <span className="font-[family-name:var(--font-brand)] text-3xl">
          {totalIsFrom ? <span className="kicker mr-2 normal-case">a partir de</span> : null}
          {formatPrice(total)}
        </span>
        <span className="max-w-md text-xs leading-relaxed text-muted-foreground">
          {totalIsFrom
            ? "Estimativa com o menor preço de cada peça — variações podem ter valores diferentes. "
            : "Valor de referência. "}
          Condições e frete são combinados diretamente pelo WhatsApp.
        </span>

        {/* Uma ressalva para a seleção inteira: a lista já marca quais peças
            são sob encomenda, e repeti-la por item tornaria a tela ilegível. */}
        {hasMadeToOrder ? (
          <div className="mt-1 max-w-md rounded-[var(--radius)] border border-[var(--gold)]/40 bg-[var(--gold)]/[0.07] p-4">
            <p className="text-[0.8125rem] leading-relaxed text-foreground/85">
              {PRICE_VARIATION_NOTICE}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <ActionLink href={whatsappHref} external variant="solid" onClick={handleSend}>
          Enviar seleção pelo WhatsApp
        </ActionLink>
        <ActionButton type="button" variant="ghost" onClick={clear}>
          Limpar seleção
        </ActionButton>
      </div>
    </div>
  );
}
