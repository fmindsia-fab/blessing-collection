"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { createCustomer, toggleCustomer, type CustomerFormState } from "@/lib/customers/actions";
import type { CustomerRow } from "@/lib/customers/queries";
import { formatPhoneBR } from "@/lib/customers/phone-mask";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CustomerFormState = {};

export function CustomersList({ customers }: { customers: CustomerRow[] }) {
  const [state, formAction, isPending] = useActionState(createCustomer, initialState);
  const [isSaving, startTransition] = useTransition();
  const [phone, setPhone] = useState("");

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
        <div className="flex flex-col divide-y divide-border border-y border-border">
          {active.map((customer) => (
            <div key={customer.id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex min-w-0 flex-col">
                <Link
                  href={`/admin/clientes/${customer.id}`}
                  className="truncate text-sm underline-offset-4 hover:underline"
                >
                  {customer.name}
                </Link>
                {customer.phone ? (
                  <span className="text-xs text-muted-foreground">{customer.phone}</span>
                ) : null}
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  if (!confirm(`Arquivar "${customer.name}"?`)) return;
                  startTransition(() => toggleCustomer(customer.id, "active"));
                }}
                className="shrink-0 text-xs uppercase tracking-[0.08em] text-muted-foreground outline-none transition-colors hover:text-destructive focus-visible:text-destructive"
              >
                Arquivar
              </button>
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
    </div>
  );
}
