"use client";

import { track } from "@/lib/analytics/track";
import { buildWhatsappLink, buildWhatsappMessage, getWhatsappCtaLabel } from "@/lib/whatsapp/build-message";
import { cn } from "@/lib/utils";
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
}: WhatsappButtonProps) {
  const message = buildWhatsappMessage({
    storeName,
    productName,
    variantLabel,
    status,
    productUrl,
  });
  const href = buildWhatsappLink(storeWhatsapp, message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track({ storeId, eventType: "whatsapp_click", productId })}
      className={cn(
        // Sólido e escuro em vez do verde do WhatsApp: o CTA precisa pertencer
        // ao editorial, não à marca de terceiro.
        "inline-flex h-12 items-center justify-center gap-2 bg-foreground px-8 text-xs uppercase tracking-[0.18em] text-background transition-colors hover:bg-[var(--gold)]",
        className,
      )}
    >
      {getWhatsappCtaLabel(status)}
    </a>
  );
}
