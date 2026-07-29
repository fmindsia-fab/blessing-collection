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
