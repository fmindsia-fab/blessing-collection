"use client";

import { useActionState, useState } from "react";
import { createLead, updateLead, type LeadFormState } from "@/lib/leads/actions";
import { LEAD_SOURCES } from "@/lib/leads/calc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { FormFooter } from "@/components/admin/form-footer";

const initialState: LeadFormState = {};

type LeadDefaults = {
  id: string;
  name: string;
  phone: string | null;
  source: string;
  interest: string | null;
  estimatedValue: number;
  nextFollowup: string | null;
  notes: string | null;
  customerId: string | null;
};

export type LeadCustomerOption = { id: string; name: string; phone: string | null };

export function LeadForm({ lead, today, customers = [] }: { lead?: LeadDefaults; today: string; customers?: LeadCustomerOption[] }) {
  const action = lead ? updateLead.bind(null, lead.id) : createLead;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [customerId, setCustomerId] = useState(lead?.customerId ?? "");
  const [name, setName] = useState(lead?.name ?? "");
  const [phone, setPhone] = useState(lead?.phone ?? "");

  // Escolher uma cliente já cadastrada preenche nome e telefone; "Nova pessoa" libera para digitar.
  function chooseCustomer(id: string) {
    setCustomerId(id);
    const customer = customers.find((item) => item.id === id);
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone ?? "");
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2 sm:p-6">
        <input type="hidden" name="customerId" value={customerId} />
        {customers.length > 0 ? (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="customer-pick">Quem é?</Label>
            <NativeSelect id="customer-pick" value={customerId} onChange={(event) => chooseCustomer(event.target.value)}>
              <option value="">Nova pessoa (digitar abaixo)</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.phone ? ` · ${customer.phone}` : ""}
                </option>
              ))}
            </NativeSelect>
            <p className="text-sm text-muted-foreground">
              Se ela já é cliente, escolha aqui e o nome e o telefone vêm sozinhos. Senão, digite os dados de uma pessoa nova.
            </p>
          </div>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nome do contato</Label>
          <Input
            id="name"
            name="name"
            maxLength={80}
            required
            autoComplete="off"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (customerId) setCustomerId("");
            }}
            placeholder="Ex.: Mariana"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Telefone / WhatsApp (opcional)</Label>
          <Input id="phone" name="phone" inputMode="tel" maxLength={30} autoComplete="off" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(11) 98888-7777" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="source">De onde veio</Label>
          <NativeSelect id="source" name="source" defaultValue={lead?.source ?? "whatsapp"}>
            {LEAD_SOURCES.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="interest">Peça de interesse (opcional)</Label>
          <Input id="interest" name="interest" maxLength={200} defaultValue={lead?.interest ?? ""} placeholder="Ex.: Clutch Safira em azul" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="estimatedValue">Valor estimado (R$)</Label>
          <Input
            id="estimatedValue"
            name="estimatedValue"
            inputMode="decimal"
            defaultValue={lead?.estimatedValue ? String(lead.estimatedValue).replace(".", ",") : ""}
            placeholder="0,00"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nextFollowup">Voltar a falar em (opcional)</Label>
          <Input id="nextFollowup" name="nextFollowup" type="date" min={lead ? undefined : today} defaultValue={lead?.nextFollowup ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="notes">Observações (opcional)</Label>
          <textarea
            id="notes"
            name="notes"
            maxLength={1000}
            rows={3}
            defaultValue={lead?.notes ?? ""}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
          />
        </div>
      </section>

      <FormFooter
        sticky
        isPending={isPending}
        error={state.error}
        success={state.success}
        successMessage="Contato salvo."
        submitLabel={lead ? "Salvar contato" : "Adicionar ao funil"}
      />
    </form>
  );
}
