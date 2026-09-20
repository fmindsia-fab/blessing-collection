import { formatBRL, formatOrderDate } from "./labels";

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
};

/**
 * Monta a mensagem de cobrança que a proprietária envia pelo WhatsApp:
 * cliente, data, itens (quantidade × preço unitário = subtotal), total e a
 * chave PIX — pedido do usuário, para não digitar isso na mão a cada pedido.
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
}: BuildInvoiceMessageParams): string {
  const lines = [
    `*${storeName}* — Cobrança`,
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

  return lines.join("\n");
}
