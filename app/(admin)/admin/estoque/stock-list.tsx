"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CheckIcon, HistoryIcon, SearchIcon, SlidersHorizontalIcon, TriangleAlertIcon } from "lucide-react";
import { adjustStock, setMinStock } from "@/lib/stock/actions";
import { STOCK_LEVEL_LABEL, stockLevel, type StockLevel } from "@/lib/stock/calc";
import { formatMoney, formatQuantity, formatUnitCost } from "@/lib/stock/format";
import type { StockRow } from "@/lib/stock/queries";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/admin/status-pill";
import { usePortalThemeProps } from "../theme-provider";
import { cn } from "@/lib/utils";

const LEVEL_TONE: Record<StockLevel, "positive" | "accent" | "muted" | "neutral"> = {
  ok: "positive",
  low: "accent",
  empty: "accent",
  negative: "accent",
  untracked: "muted",
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Janela para informar quanto a pessoa tem agora. Serve para o estoque inicial, a contagem do
// armário e as perdas: o sistema lança só a diferença, e o histórico fica guardado.
function AdjustDialog({ row, onClose }: { row: StockRow | null; onClose: () => void }) {
  const portalTheme = usePortalThemeProps();
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setQuantity("");
    setNote("");
    setError(null);
    onClose();
  }

  function save() {
    if (!row) return;
    setError(null);
    startTransition(async () => {
      const result = await adjustStock(row.id, Number(quantity.replace(",", ".")), note);
      if (result.error) {
        setError(result.error);
        return;
      }
      close();
    });
  }

  return (
    <Dialog open={row !== null} onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent {...portalTheme}>
        <DialogTitle>{row?.tracked ? `Ajustar estoque de ${row.name}` : `Quanto você tem de ${row?.name ?? ""}?`}</DialogTitle>
        <DialogDescription>
          {row?.tracked
            ? `Hoje o sistema mostra ${formatQuantity(row.stock)} ${row.unit}. Informe quanto você tem de verdade (conte o que está guardado) e o sistema acerta a diferença.`
            : "Informe quanto você tem guardado agora. A partir daí o sistema passa a controlar este material: soma as compras e desconta o que os pedidos usam."}
        </DialogDescription>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="adjust-quantity">Quantidade que você tem agora ({row?.unit})</Label>
          <Input
            id="adjust-quantity"
            inputMode="decimal"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="0"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="adjust-note">Observação (opcional)</Label>
          <Input
            id="adjust-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={300}
            placeholder="Ex.: contagem do armário, perda, doação"
          />
        </div>

        {error ? (
          <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={close}>
            Cancelar
          </Button>
          <Button type="button" onClick={save} disabled={isPending || quantity.trim() === ""}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MinStockField({ row }: { row: StockRow }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`min-${row.id}`} className="text-sm font-medium">
        Avisar quando chegar em ({row.unit})
      </Label>
      <Input
        id={`min-${row.id}`}
        type="number"
        min="0"
        step="any"
        defaultValue={row.minStock ?? ""}
        placeholder="Sem aviso"
        onBlur={(event) => {
          const raw = event.target.value.trim();
          const next = raw === "" ? null : Number(raw);
          if (next === row.minStock || (next !== null && !Number.isFinite(next))) return;
          setError(null);
          setSaved(false);
          startTransition(async () => {
            const result = await setMinStock(row.id, next);
            if (result.error) setError(result.error);
            else setSaved(true);
          });
        }}
        className="max-w-40"
      />
      {error ? <span className="text-sm text-destructive">{error}</span> : null}
      {saved ? (
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <CheckIcon className="size-3.5 text-[var(--gold)]" aria-hidden /> Salvo
        </span>
      ) : null}
    </div>
  );
}

export function StockList({ rows }: { rows: StockRow[] }) {
  const [query, setQuery] = useState("");
  const [adjusting, setAdjusting] = useState<StockRow | null>(null);

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    return needle ? rows.filter((row) => normalize(row.name).includes(needle)) : rows;
  }, [rows, query]);

  const tracked = filtered.filter((row) => row.tracked);
  const untracked = filtered.filter((row) => !row.tracked);

  const needAttention = rows.filter((row) => {
    const level = stockLevel(row.stock, row.minStock, row.tracked);
    return level === "low" || level === "empty" || level === "negative";
  }).length;

  return (
    <div className="flex flex-col gap-8">
      {needAttention > 0 ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-2xl border border-[var(--gold)]/40 bg-[var(--brand-soft)] px-4 py-3 text-sm font-medium"
        >
          <TriangleAlertIcon className="size-5 shrink-0 text-[var(--gold)]" aria-hidden />
          {needAttention === 1
            ? "1 material está acabando ou com saldo negativo."
            : `${needAttention} materiais estão acabando ou com saldo negativo.`}
        </p>
      ) : null}

      {rows.length > 6 ? (
        <div className="relative max-w-md">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar material…"
            aria-label="Buscar material pelo nome"
            className="h-11 w-full rounded-full border border-input bg-card pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
          />
        </div>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Com controle de estoque{" "}
          <span className="text-sm font-normal text-muted-foreground">({tracked.length})</span>
        </h2>

        {tracked.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum material com controle ainda. Escolha um material abaixo e informe quanto você tem, ou
            registre uma compra: o controle começa sozinho.
          </p>
        ) : (
          tracked.map((row) => {
            const level = stockLevel(row.stock, row.minStock, row.tracked);
            return (
              <article
                key={row.id}
                className={cn(
                  "flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5",
                  level === "ok" ? "border-border" : "border-[var(--gold)]/50",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="break-words text-base font-semibold">{row.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Custo cadastrado: {formatUnitCost(row.unitCost)} por {row.unit}
                    </p>
                  </div>
                  <StatusPill tone={LEVEL_TONE[level]}>{STOCK_LEVEL_LABEL[level]}</StatusPill>
                </div>

                <div className="flex flex-wrap items-end justify-between gap-4">
                  <p className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Você tem</span>
                    <span className={cn("text-3xl font-semibold tabular-nums", row.stock < 0 && "text-destructive")}>
                      {formatQuantity(row.stock)} <span className="text-lg font-medium">{row.unit}</span>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Vale cerca de {formatMoney(Math.max(0, row.stock) * row.unitCost)}
                    </span>
                  </p>
                  <MinStockField row={row} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setAdjusting(row)}>
                    <SlidersHorizontalIcon /> Ajustar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" render={<Link href={`/admin/estoque/${row.id}`} />}>
                    <HistoryIcon /> Extrato
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </section>

      {untracked.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-tight">
              Sem controle <span className="text-sm font-normal text-muted-foreground">({untracked.length})</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Estes materiais ainda não entram no estoque. Informe quanto você tem para começar a controlar.
            </p>
          </div>
          {untracked.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
            >
              <span className="min-w-0 break-words text-sm font-medium">{row.name}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => setAdjusting(row)}>
                Controlar este material
              </Button>
            </div>
          ))}
        </section>
      ) : null}

      <AdjustDialog key={adjusting?.id ?? "none"} row={adjusting} onClose={() => setAdjusting(null)} />
    </div>
  );
}
