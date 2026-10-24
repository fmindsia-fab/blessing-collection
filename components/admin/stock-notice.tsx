"use client";

import Link from "next/link";
import { AlertCircleIcon, PackageCheckIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import type { OrderStatusResult } from "@/lib/orders/actions";
import { formatQuantity } from "@/lib/stock/format";

// Aviso depois de mudar a situação de um pedido: o que mudou no estoque e, principalmente, o que
// ficou faltando. Faltar material nunca trava a produção: é só um lembrete para comprar.
export function StockNotice({ result, onDismiss }: { result: OrderStatusResult | null; onDismiss: () => void }) {
  if (!result) return null;

  const shortages = result.shortages ?? [];
  const hasInfo = Boolean(result.error) || shortages.length > 0 || (result.consumed ?? 0) > 0 || (result.returned ?? 0) > 0;
  if (!hasInfo) return null;

  const tone = result.error ? "error" : shortages.length > 0 ? "warning" : "info";

  return (
    <div
      role={result.error ? "alert" : "status"}
      className={
        tone === "error"
          ? "flex items-start gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
          : "flex items-start gap-3 rounded-2xl border border-[var(--gold)]/40 bg-[var(--brand-soft)] px-4 py-3 text-sm"
      }
    >
      <span className="mt-0.5 shrink-0">
        {tone === "error" ? (
          <AlertCircleIcon className="size-5" aria-hidden />
        ) : tone === "warning" ? (
          <TriangleAlertIcon className="size-5 text-[var(--gold)]" aria-hidden />
        ) : (
          <PackageCheckIcon className="size-5 text-[var(--gold)]" aria-hidden />
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {result.error ? <p className="font-medium">{result.error}</p> : null}

        {!result.error && (result.consumed ?? 0) > 0 ? (
          <p className="font-medium">
            Os materiais deste pedido foram descontados do estoque ({result.consumed}{" "}
            {result.consumed === 1 ? "material" : "materiais"}).
          </p>
        ) : null}

        {!result.error && (result.returned ?? 0) > 0 ? (
          <p className="font-medium">
            Os materiais deste pedido voltaram para o estoque ({result.returned}{" "}
            {result.returned === 1 ? "material" : "materiais"}).
          </p>
        ) : null}

        {shortages.length > 0 ? (
          <>
            <p className="font-medium">Atenção: o estoque ficou negativo. Faltou material:</p>
            <ul className="list-disc pl-5">
              {shortages.map((shortage) => (
                <li key={`${shortage.name}-${shortage.unit}`}>
                  {shortage.name}: faltam {formatQuantity(shortage.short)} {shortage.unit}
                </li>
              ))}
            </ul>
            <p>
              A produção continua normal.{" "}
              <Link href="/admin/compras/nova" className="font-medium underline underline-offset-4">
                Registrar uma compra
              </Link>{" "}
              ou{" "}
              <Link href="/admin/estoque" className="font-medium underline underline-offset-4">
                conferir o estoque
              </Link>
              .
            </p>
          </>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar aviso"
        className="flex size-8 shrink-0 items-center justify-center rounded-full outline-none transition-colors hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
