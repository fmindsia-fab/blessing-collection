"use client";

import Link from "next/link";
import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";

// Aceite eletrônico: caixa OBRIGATÓRIA e inicialmente DESMARCADA, com os nomes dos
// documentos como links (abrem em outra aba, para não perder o preenchimento).
// Funciona de dois jeitos:
//  - controlada (checked + onCheckedChange): usada no formulário da conta;
//  - com `name`: dentro de um <form action={...}> nativo, envia "on" quando marcada.
export function AcceptTermsField({
  name,
  checked,
  onCheckedChange,
}: {
  name?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  const id = useId();
  const linkClass =
    "font-medium underline underline-offset-4 outline-none transition-colors hover:text-foreground focus-visible:text-foreground";

  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        name={name}
        required
        {...(checked === undefined
          ? { defaultChecked: false }
          : { checked, onCheckedChange: (value: boolean) => onCheckedChange?.(value) })}
        className="mt-0.5"
      />
      <label htmlFor={id} className="text-sm leading-snug">
        Li e concordo com os{" "}
        <Link href="/termos" target="_blank" rel="noopener noreferrer" className={linkClass}>
          Termos de Uso
        </Link>{" "}
        e a{" "}
        <Link href="/privacidade" target="_blank" rel="noopener noreferrer" className={linkClass}>
          Política de Privacidade
        </Link>
        .
      </label>
    </div>
  );
}
