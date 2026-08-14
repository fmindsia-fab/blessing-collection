import { isPriceVariable, PRICE_VARIATION_WHATSAPP_NOTE } from "@/lib/pricing/price-display";
import type { ProductStatus } from "@/types/database.types";

type BuildWhatsappMessageParams = {
  storeName: string;
  productName: string;
  variantLabel?: string | null;
  status: ProductStatus;
  productUrl: string;
};

// "Peça" e não "bolsa": o catálogo tem bolsas, pulseiras e acessórios, e o
// mesmo botão serve a todos. É o termo que a seleção múltipla já usa.
const CTA_LABEL: Record<Exclude<ProductStatus, "inactive">, string> = {
  available: "Quero esta peça",
  made_to_order: "Encomendar esta peça",
  sold_out: "Consultar disponibilidade",
};

function buildIntentSentence(status: ProductStatus, productName: string, variantLabel?: string | null) {
  const variantSuffix = variantLabel ? `, ${variantLabel}` : "";

  // Sem artigo antes do nome ("a Maxi Pulseira", "o Colar"): o catálogo tem
  // peças de ambos os gêneros e não há como saber qual usar a partir do nome.
  switch (status) {
    case "made_to_order":
      return `Tenho interesse em encomendar: ${productName}${variantSuffix}. Poderia me informar prazo de produção e opções de personalização?`;
    case "sold_out":
      return `Gostaria de saber se esta peça tem previsão de reposição ou se é possível encomendar: ${productName}${variantSuffix}.`;
    case "available":
    default:
      return `Tenho interesse nesta peça: ${productName}${variantSuffix}.`;
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
  const base = `Olá! ${intent} Vi o produto no catálogo da ${storeName}: ${productUrl}`;

  // A ressalva chega junto do pedido, então a proprietária já responde com o
  // valor vigente. Só sob encomenda: peça pronta tem preço firme.
  return isPriceVariable(status) ? `${base}\n\n${PRICE_VARIATION_WHATSAPP_NOTE}` : base;
}

export function buildWhatsappLink(whatsappNumber: string, message: string): string {
  const digitsOnly = whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

type SelectionMessageItem = {
  name: string;
  url: string;
  status?: ProductStatus;
  /** Variação escolhida na página da peça, se houver. */
  variantName?: string | null;
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

  // A variação escolhida entra logo após o nome: é o que a proprietária
  // precisa saber para separar a peça certa.
  const list = items
    .map((item) => {
      const variant = item.variantName ? ` — ${item.variantName}` : "";
      return `• ${item.name}${variant}${selectionStatusSuffix(item.status)} — ${item.url}`;
    })
    .join("\n");

  // Uma única ressalva no fim, não uma por item: a lista já marca quais são
  // sob encomenda, e repetir a observação em cada linha tornaria a mensagem
  // ilegível.
  const hasVariablePrice = items.some((item) => item.status && isPriceVariable(item.status));
  const notice = hasVariablePrice ? `\n\n${PRICE_VARIATION_WHATSAPP_NOTE}` : "";

  return `${intro}\n\n${list}${notice}`;
}
