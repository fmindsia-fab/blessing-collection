"use client";

import { track } from "@/lib/analytics/track";
import { buildWhatsappLink, buildWhatsappMessage, getWhatsappCtaLabel } from "@/lib/whatsapp/build-message";
import { cn } from "@/lib/utils";
import { actionVariants } from "@/components/ui/action";
import type { ProductStatus } from "@/types/database.types";

type WhatsappButtonProps = {
  storeId: string;
  storeName: string;
  storeWhatsapp: string;
  productId: string;
  productName: string;
  productUrl: string;
  status: ProductStatus;
  variantLabel?: string | null;
  className?: string;
  tabIndex?: number;
  /** Quando há uma escolha obrigatória pendente: o botão fica desativado e explica o motivo. */
  disabledReason?: string;
};

export function WhatsappButton({
  storeId,
  storeName,
  storeWhatsapp,
  productId,
  productName,
  productUrl,
  status,
  variantLabel,
  className,
  tabIndex,
  disabledReason,
}: WhatsappButtonProps) {
  const message = buildWhatsappMessage({
    storeName,
    productName,
    variantLabel,
    status,
    productUrl,
  });
  const href = buildWhatsappLink(storeWhatsapp, message);

  if (disabledReason) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title={disabledReason}
        tabIndex={tabIndex}
        className={cn(actionVariants({ variant: "solid" }), "cursor-not-allowed opacity-50", className)}
      >
        {getWhatsappCtaLabel(status)}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={tabIndex}
      onClick={() => track({ storeId, eventType: "whatsapp_click", productId })}
      className={cn(actionVariants({ variant: "solid" }), className)}
    >
      {getWhatsappCtaLabel(status)}
    </a>
  );
}
