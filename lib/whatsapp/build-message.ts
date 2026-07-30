import type { ProductStatus } from "@/types/database.types";

type BuildWhatsappMessageParams = {
  storeName: string;
  productName: string;
  variantLabel?: string | null;
  status: ProductStatus;
  productUrl: string;
};

const CTA_LABEL: Record<Exclude<ProductStatus, "inactive">, string> = {
  available: "Quero esta bolsa",
  made_to_order: "Encomendar esta bolsa",
  sold_out: "Consultar disponibilidade",
};

function buildIntentSentence(status: ProductStatus, productName: string, variantLabel?: string | null) {
  const variantSuffix = variantLabel ? `, ${variantLabel}` : "";

  switch (status) {
    case "made_to_order":
      return `Tenho interesse em encomendar a ${productName}${variantSuffix}. Poderia me informar prazo de produção e opções de personalização?`;
    case "sold_out":
      return `Gostaria de saber se a ${productName}${variantSuffix} tem previsão de reposição ou se é possível encomendar.`;
    case "available":
    default:
      return `Tenho interesse na ${productName}${variantSuffix}.`;
  }
}

export function getWhatsappCtaLabel(status: ProductStatus): string {
  if (status === "inactive") return CTA_LABEL.available;
  return CTA_LABEL[status];
}

export function buildWhatsappMessage({
  storeName,
  productName,
  variantLabel,
  status,
  productUrl,
}: BuildWhatsappMessageParams): string {
  const intent = buildIntentSentence(status, productName, variantLabel);
  return `Olá! ${intent} Vi o produto no catálogo da ${storeName}: ${productUrl}`;
}

export function buildWhatsappLink(whatsappNumber: string, message: string): string {
  const digitsOnly = whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

type SelectionMessageItem = {
  name: string;
  url: string;
  status?: ProductStatus;
};

// Sufixo por status: a peça esgotada/sob encomenda precisa chegar sinalizada
// na mensagem, senão a proprietária responde como se estivesse disponível.
const SELECTION_STATUS_SUFFIX: Record<Exclude<ProductStatus, "inactive">, string> = {
  available: "",
  made_to_order: " (sob encomenda)",
  sold_out: " (esgotada — gostaria de saber sobre reposição)",
};

function selectionStatusSuffix(status?: ProductStatus): string {
  if (!status || status === "inactive") return "";
  return SELECTION_STATUS_SUFFIX[status];
}

export function buildSelectionWhatsappMessage(storeName: string, items: SelectionMessageItem[]): string {
  const intro =
    items.length === 1
      ? `Olá! Tenho interesse nesta peça do catálogo da ${storeName}:`
      : `Olá! Tenho interesse nestas ${items.length} peças do catálogo da ${storeName}:`;

  const list = items
    .map((item) => `• ${item.name}${selectionStatusSuffix(item.status)} — ${item.url}`)
    .join("\n");

  return `${intro}\n\n${list}`;
}
