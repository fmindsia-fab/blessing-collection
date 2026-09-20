"use client";

import { ReceiptIcon } from "lucide-react";
import { buildInvoiceMessage, type InvoiceItem } from "@/lib/orders/build-invoice-message";

/**
 * Monta a cobrança do pedido (cliente, data, itens, total, chave PIX) e abre
 * o WhatsApp direto no número da cliente com a mensagem pronta — pedido do
 * usuário. Diferente do ShareButton (que abre a folha de compartilhar
 * genérica), aqui o destino é sempre o WhatsApp e sempre o número da cliente
 * daquele pedido, então usa `wa.me/<número>` em vez de compartilhamento.
 */
export function InvoiceButton({
  storeName,
  customerName,
  customerPhone,
  orderDate,
  items,
  totalAmount,
  pixKey,
}: {
  storeName: string;
  customerName: string;
  customerPhone: string | null;
  orderDate: string;
  items: InvoiceItem[];
  totalAmount: number;
  pixKey: string | null;
}) {
  function handleSend() {
    const message = buildInvoiceMessage({ storeName, customerName, orderDate, items, totalAmount, pixKey });
    const digitsOnly = customerPhone?.replace(/\D/g, "") ?? "";
    // Com telefone cadastrado, abre a conversa já com a cliente; sem
    // telefone, abre o WhatsApp em branco — a proprietária escolhe o contato
    // e cola a mensagem, já copiada para a área de transferência.
    const url = digitsOnly
      ? `https://wa.me/55${digitsOnly}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    if (!digitsOnly) {
      navigator.clipboard?.writeText(message).catch(() => {});
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleSend}
      className="group inline-flex h-10 items-center justify-center gap-2.5 whitespace-nowrap rounded-full border border-foreground/30 px-5 text-[0.6875rem] uppercase tracking-[0.16em] text-foreground outline-none transition-colors duration-300 hover:border-foreground hover:bg-foreground hover:text-background focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <ReceiptIcon className="size-3.5" />
      Enviar cobrança
    </button>
  );
}
