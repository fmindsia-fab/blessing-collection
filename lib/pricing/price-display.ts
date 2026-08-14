import type { ProductStatus } from "@/types/database.types";

/**
 * Regra única de exibição de preço, derivada do status da peça.
 *
 * Peça pronta tem preço firme — carregar ressalva ali enfraqueceria a confiança
 * onde não existe incerteza. Só a peça sob encomenda depende do custo do
 * material no momento da produção, e é onde o aviso cabe.
 *
 * Todo componente que mostra preço consulta daqui: rótulo, aviso e texto do
 * WhatsApp precisam concordar entre si, e três cópias da mesma condição
 * divergiriam com o tempo.
 */
export function isPriceVariable(status: ProductStatus): boolean {
  return status === "made_to_order";
}

/** "Valor da peça" para pronta-entrega, "Valor de referência" sob encomenda. */
export function priceLabel(status: ProductStatus): string {
  return isPriceVariable(status) ? "Valor de referência" : "Valor da peça";
}

export const PRICE_VARIATION_NOTICE =
  "Por se tratar de uma peça produzida sob encomenda, o valor pode sofrer alterações conforme a disponibilidade e o custo dos materiais utilizados na produção. Consulte a Blessing para confirmar o valor vigente antes de finalizar o pedido.";

/** Versão curta, para a mensagem do WhatsApp. */
export const PRICE_VARIATION_WHATSAPP_NOTE =
  "_Valor de referência sujeito à confirmação conforme disponibilidade e custo dos materiais._";
