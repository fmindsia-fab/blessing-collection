import { formatBRL, formatOrderDate } from "./labels";

/** Desconto fixo do cupom de próxima encomenda, oferecido em todo resumo de pedido. */
export const INVOICE_COUPON_PERCENT = 10;

export type InvoiceItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

export type BuildInvoiceMessageParams = {
  storeName: string;
  customerName: string;
  orderDate: string;
  items: InvoiceItem[];
  totalAmount: number;
  pixKey: string | null;
  /** Código do cupom para a próxima encomenda — por convenção, o nome da cliente. */
  couponCode: string;
  /** Percentual fixo de desconto do cupom (ex: 10 para 10%). */
  couponPercent: number;
};

/**
 * Monta o resumo do pedido que a proprietária envia pelo WhatsApp: cliente,
 * data, itens (quantidade × preço unitário = subtotal), total, chave PIX e
 * um cupom de desconto para a próxima encomenda — pedido do usuário, para
 * não digitar isso na mão a cada pedido.
 *
 * Texto puro, não HTML/markdown: é colado direto no WhatsApp.
 */
export function buildInvoiceMessage({
  storeName,
  customerName,
  orderDate,
  items,
  totalAmount,
  pixKey,
  couponCode,
  couponPercent,
}: BuildInvoiceMessageParams): string {
  const lines = [
    `*${storeName}* — Resumo do pedido`,
    "",
    `Cliente: ${customerName}`,
    `Data: ${formatOrderDate(orderDate)}`,
    "",
    "Itens:",
    ...items.map(
      (item) =>
        `• ${item.name} — ${item.quantity} × ${formatBRL(item.unitPrice)} = ${formatBRL(item.quantity * item.unitPrice)}`,
    ),
    "",
    `*Total: ${formatBRL(totalAmount)}*`,
  ];

  if (pixKey) {
    lines.push("", `Chave PIX: ${pixKey}`);
  }

  if (couponCode.trim()) {
    lines.push(
      "",
      `Presente pra próxima encomenda: cupom *${couponCode.trim()}* com ${couponPercent}% de desconto 💛`,
    );
  }

  return lines.join("\n");
}
