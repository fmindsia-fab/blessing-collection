"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { createCustomer, toggleCustomer, type CustomerFormState } from "@/lib/customers/actions";
import type { CustomerRow } from "@/lib/customers/queries";
import { formatPhoneBR } from "@/lib/customers/phone-mask";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

const initialState: CustomerFormState = {};

export function CustomersList({ customers }: { customers: CustomerRow[] }) {
  const [state, formAction, isPending] = useActionState(createCustomer, initialState);
  const [isSaving, startTransition] = useTransition();
  const [phone, setPhone] = useState("");
  const [archiving, setArchiving] = useState<{ id: string; name: string } | null>(null);

  const active = customers.filter((c) => c.status === "active");
  const archived = customers.filter((c) => c.status === "archived");

  // Limpa o campo ao adicionar: a contagem de clientes muda quando a Server
  // Action revalida com sucesso, mesmo sinal usado no cadastro de materiais.
  const [syncedCount, setSyncedCount] = useState(customers.length);
  if (customers.length !== syncedCount) {
    setSyncedCount(customers.length);
    setPhone("");
  }

  return (
    <div className="flex flex-col gap-6">
      {active.length > 0 ? (
        <div className="flex flex-col gap-2">
          {active.map((customer) => (
            <div
              key={customer.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition-colors hover:border-[var(--gold)]/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-semibold text-[var(--gold)]"
                >
                  {customer.name.trim().charAt(0).toUpperCase()}
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{customer.name}</span>
                  {customer.phone ? (
                    <span className="text-xs text-muted-foreground">{formatPhoneBR(customer.phone)}</span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <Link
                  href={`/admin/clientes/${customer.id}`}
                  className="text-sm font-medium text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline"
                >
                  Editar
                </Link>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setArchiving({ id: customer.id, name: customer.name })}
                  className="text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-destructive focus-visible:text-destructive"
                >
                  Arquivar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-[var(--radius)] border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
          Nenhuma cliente cadastrada ainda.
        </p>
      )}

      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cust-name">Nome</Label>
          <Input id="cust-name" name="name" required maxLength={120} placeholder="Nome da cliente" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cust-phone">Telefone</Label>
          <Input
            id="cust-phone"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
            maxLength={15}
            placeholder="(11) 99999-9999"
            inputMode="tel"
          />
        </div>
        <Button type="submit" variant="outline" disabled={isPending} className="self-end">
          {isPending ? "Salvando..." : "Adicionar"}
        </Button>
        {state.error ? <p className="text-sm text-destructive sm:col-span-3">{state.error}</p> : null}
      </form>

      {archived.length > 0 ? (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Clientes arquivadas ({archived.length})</summary>
          <div className="mt-3 flex flex-col divide-y divide-border border-y border-border">
            {archived.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between gap-4 py-2.5">
                <span>{customer.name}</span>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => startTransition(() => toggleCustomer(customer.id, "archived"))}
                  className="text-foreground underline underline-offset-4"
                >
                  Restaurar
                </button>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(open) => {
          if (!open) setArchiving(null);
        }}
        title={`Arquivar ${archiving?.name ?? "cliente"}?`}
        description="A cliente sai da lista, mas o histórico de pedidos dela continua guardado."
        confirmLabel="Arquivar"
        onConfirm={() => {
          if (archiving) startTransition(() => toggleCustomer(archiving.id, "active"));
        }}
      />
    </div>
  );
}
