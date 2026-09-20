"use client";

import { useState } from "react";
import { ReceiptIcon, XIcon } from "lucide-react";
import { buildInvoiceMessage, INVOICE_COUPON_PERCENT, type InvoiceItem } from "@/lib/orders/build-invoice-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Monta o resumo do pedido (cliente, data, itens, total, chave PIX e um
 * cupom de desconto para a próxima encomenda) e abre o WhatsApp direto no
 * número da cliente com a mensagem pronta — pedido do usuário.
 *
 * O nome do cupom é sempre o nome da cliente, pedido do usuário — por isso o
 * campo abre pré-preenchido com `customerName`, editável, e obrigatório (não
 * deixa enviar em branco). Diferente do ShareButton (folha de compartilhar
 * genérica), aqui o destino é sempre o WhatsApp da cliente daquele pedido,
 * então usa `wa.me/<número>` em vez de compartilhamento.
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
  const [isOpen, setIsOpen] = useState(false);
  const [couponCode, setCouponCode] = useState(customerName);

  function handleSend() {
    if (!couponCode.trim()) return;

    const message = buildInvoiceMessage({
      storeName,
      customerName,
      orderDate,
      items,
      totalAmount,
      pixKey,
      couponCode,
      couponPercent: INVOICE_COUPON_PERCENT,
    });
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
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group inline-flex h-10 items-center justify-center gap-2.5 whitespace-nowrap rounded-full border border-foreground/30 px-5 text-[0.6875rem] uppercase tracking-[0.16em] text-foreground outline-none transition-colors duration-300 hover:border-foreground hover:bg-foreground hover:text-background focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <ReceiptIcon className="size-3.5" />
        Enviar resumo do pedido
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-dashed border-border p-4 sm:min-w-80">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Cupom da próxima encomenda
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Cancelar"
          className="text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="invoice-coupon" className="text-xs">
          Nome do cupom ({INVOICE_COUPON_PERCENT}% de desconto)
        </Label>
        <Input
          id="invoice-coupon"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          maxLength={40}
          autoFocus
          required
        />
      </div>

      <Button type="button" size="sm" disabled={!couponCode.trim()} onClick={handleSend} className="w-fit">
        <ReceiptIcon className="size-3.5" />
        Enviar resumo do pedido
      </Button>
    </div>
  );
}
