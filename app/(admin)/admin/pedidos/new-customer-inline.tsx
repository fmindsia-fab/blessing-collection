"use client";

import { useActionState, useState } from "react";
import { UserPlusIcon, XIcon } from "lucide-react";
import { createCustomerInline, type CreateCustomerInlineState } from "@/lib/customers/actions";
import { formatPhoneBR } from "@/lib/customers/phone-mask";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CreateCustomerInlineState = {};

/**
 * Atalho "+ Nova cliente" no formulário de pedido: cadastra sem sair da
 * tela e já seleciona a cliente criada — decisão do usuário, para não
 * interromper o fluxo de montar um pedido só para cadastrar quem encomendou.
 */
export function NewCustomerInline({
  onCreated,
}: {
  onCreated: (customer: { id: string; name: string; phone: string | null }) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [state, formAction, isPending] = useActionState(async (
    _prevState: CreateCustomerInlineState,
    formData: FormData,
  ) => {
    const result = await createCustomerInline(_prevState, formData);
    if (result.customer) {
      onCreated(result.customer);
      setIsOpen(false);
      setPhone("");
    }
    return result;
  }, initialState);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline"
      >
        <UserPlusIcon className="size-3.5" />
        Nova cliente
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-[var(--radius)] border border-dashed border-border p-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Nova cliente
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

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <div className="flex flex-col gap-1">
          <Label htmlFor="new-customer-name" className="text-xs">
            Nome
          </Label>
          <Input id="new-customer-name" name="name" required maxLength={120} autoFocus />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="new-customer-phone" className="text-xs">
            Telefone
          </Label>
          <Input
            id="new-customer-phone"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
            maxLength={15}
            placeholder="(11) 99999-9999"
            inputMode="tel"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={isPending} className="self-end">
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
    </form>
  );
}
