"use client";

import { useState, useTransition } from "react";
import { UserPlusIcon, XIcon } from "lucide-react";
import { createCustomerInline } from "@/lib/customers/actions";
import { formatPhoneBR } from "@/lib/customers/phone-mask";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Atalho "+ Nova cliente" no formulário de pedido: cadastra sem sair da
 * tela e já seleciona a cliente criada — decisão do usuário, para não
 * interromper o fluxo de montar um pedido só para cadastrar quem encomendou.
 *
 * Sem <form> aqui: este componente vive dentro do <form> do pedido
 * (order-form.tsx), e HTML não permite formulário dentro de formulário —
 * o clique em "Salvar" era capturado pelo form externo em vez de disparar
 * este cadastro, então nada era salvo. A action é chamada diretamente (não
 * via useActionState + action prop de um form), com os valores em state.
 */
export function NewCustomerInline({
  onCreated,
}: {
  onCreated: (customer: { id: string; name: string; phone: string | null }) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("phone", phone);
      const result = await createCustomerInline({}, formData);

      if (result.customer) {
        onCreated(result.customer);
        setIsOpen(false);
        setName("");
        setPhone("");
      } else {
        setError(result.error ?? "Não foi possível cadastrar a cliente.");
      }
    });
  }

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
    <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-dashed border-border p-3">
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

      <div className="flex flex-col gap-1">
        <Label htmlFor="new-customer-name" className="text-xs">
          Nome
        </Label>
        <Input
          id="new-customer-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="new-customer-phone" className="text-xs">
          Telefone
        </Label>
        <Input
          id="new-customer-phone"
          value={phone}
          onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
          maxLength={15}
          placeholder="(11) 99999-9999"
          inputMode="tel"
        />
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending || !name.trim()}
        onClick={handleSave}
        className="w-fit"
      >
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
