import type { OrderStatus } from "@/types/database.types";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  quote: "Orçamento",
  confirmed: "Confirmado",
  in_production: "Em produção",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "quote",
  "confirmed",
  "in_production",
  "ready",
  "delivered",
  "cancelled",
];

export function formatOrderDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
