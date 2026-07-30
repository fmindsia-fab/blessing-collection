"use client";

import Image from "next/image";
import Link from "next/link";
import { XIcon } from "lucide-react";
import { useSelection } from "@/lib/selection/selection-context";
import { track } from "@/lib/analytics/track";
import { buildSelectionWhatsappMessage, buildWhatsappLink } from "@/lib/whatsapp/build-message";
import { Button } from "@/components/ui/button";

type SelectionReviewProps = {
  storeId: string;
  storeName: string;
  storeWhatsapp: string;
  siteUrl: string;
};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function SelectionReview({ storeId, storeName, storeWhatsapp, siteUrl }: SelectionReviewProps) {
  const { items, remove, clear, isHydrated } = useSelection();

  if (!isHydrated) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 py-12">
        <p className="text-sm text-zinc-500">Você ainda não escolheu nenhuma peça.</p>
        <Button render={<Link href="/produtos" />} variant="outline">
          Ver produtos
        </Button>
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + item.price, 0);

  const message = buildSelectionWhatsappMessage(
    storeName,
    items.map((item) => ({ name: item.name, url: `${siteUrl}/produtos/${item.slug}` })),
  );
  const whatsappHref = buildWhatsappLink(storeWhatsapp, message);

  function handleSend() {
    // Um evento por produto: mantém o ranking de interesse por peça correto.
    items.forEach((item) => track({ storeId, eventType: "whatsapp_click", productId: item.productId }));
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col divide-y divide-zinc-200 border-y border-zinc-200">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-4 py-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
              {item.coverImageUrl ? (
                <Image src={item.coverImageUrl} alt={item.name} fill className="object-cover" sizes="64px" />
              ) : null}
            </div>
            <div className="flex flex-1 flex-col">
              <Link href={`/produtos/${item.slug}`} className="text-sm font-medium hover:underline">
                {item.name}
              </Link>
              <span className="text-sm text-zinc-600">{formatPrice(item.price)}</span>
            </div>
            <button
              type="button"
              onClick={() => remove(item.productId)}
              aria-label={`Remover ${item.name} da seleção`}
              className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600">
          {items.length} {items.length === 1 ? "peça selecionada" : "peças selecionadas"}
        </span>
        <span className="text-lg font-medium">{formatPrice(total)}</span>
        <span className="text-xs text-zinc-500">
          Valor de referência. Condições e frete são combinados diretamente pelo WhatsApp.
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleSend}
          className="inline-flex h-11 items-center justify-center rounded-full bg-[#25D366] px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Enviar seleção pelo WhatsApp
        </a>
        <Button type="button" variant="ghost" onClick={clear}>
          Limpar seleção
        </Button>
      </div>
    </div>
  );
}
