"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/pricing/money";
import type { InstallmentOption } from "@/lib/pricing/calculate";

/**
 * Parcelamento no cartão, na página da peça.
 *
 * Recolhido por padrão: o preço à vista é o que a maioria olha, e a tabela
 * inteira aberta competiria com a foto e o botão de WhatsApp. Quem vai
 * parcelar procura.
 */
export function InstallmentOptions({
  cashPriceCents,
  options,
  isFromPrice = false,
}: {
  cashPriceCents: number;
  options: InstallmentOption[];
  /** Peça com variantes de preços diferentes: os valores partem do menor. */
  isFromPrice?: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Só interessam as modalidades que custam mais que o Pix — repetir o preço à
  // vista em três linhas não informa nada.
  const withSurcharge = options.filter((option) => option.surchargeCents > 0);
  if (withSurcharge.length === 0) return null;

  // A maior parcela é a chamada: é o número que responde "cabe no meu mês?".
  const longest = withSurcharge.reduce((max, option) =>
    option.method.installments > max.method.installments ? option : max,
  );

  return (
    <div className="flex flex-col gap-3">
      {/* "em até" sinaliza que 12x é o teto, não a única opção — sem isso, a
          frase sugere que só existe aquele parcelamento. Com uma parcela só,
          "até" não faz sentido. */}
      <p className="text-sm text-muted-foreground">
        {longest.method.installments > 1 ? (
          <>
            ou em até {longest.method.installments}× de{" "}
            <span className="text-foreground">{formatBRL(longest.installmentCents)}</span> no cartão
          </>
        ) : (
          <>
            ou <span className="text-foreground">{formatBRL(longest.priceCents)}</span> no cartão
          </>
        )}
      </p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-fit items-center gap-2 text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
      >
        {open ? "Ocultar parcelamento" : "Ver parcelamento"}
        <ChevronDownIcon
          className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")}
        />
      </button>

      {open ? (
        <dl className="flex flex-col divide-y divide-border border-y border-border text-sm">
          {isFromPrice ? (
            <p className="py-2.5 text-xs text-muted-foreground">
              Valores calculados sobre a variação de menor preço.
            </p>
          ) : null}

          <div className="flex items-baseline justify-between gap-4 py-2.5">
            <dt>À vista no Pix</dt>
            <dd className="tabular-nums">{formatBRL(cashPriceCents)}</dd>
          </div>

          {withSurcharge.map((option) => (
            <div key={option.method.id} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">
                {option.method.installments > 1
                  ? `${option.method.installments}× de ${formatBRL(option.installmentCents)}`
                  : option.method.label}
              </dt>
              <dd className="tabular-nums text-muted-foreground">{formatBRL(option.priceCents)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
