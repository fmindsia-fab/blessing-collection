type ProductDetailsProps = {
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
};

function formatNumber(value: number, unit: string) {
  // pt-BR usa vírgula decimal; até 3 casas cobre gramas (0,428 kg).
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${unit}`;
}

/**
 * "Mais detalhes" da peça: peso e dimensões.
 *
 * `<details>` nativo em vez de estado no React — funciona sem JavaScript,
 * é acessível por teclado e o navegador já cuida do aria-expanded.
 * Não renderiza nada quando nenhum campo foi preenchido.
 */
export function ProductDetails({ weightKg, lengthCm, widthCm, heightCm }: ProductDetailsProps) {
  const rows: { label: string; value: string }[] = [];

  if (weightKg) rows.push({ label: "Peso", value: formatNumber(weightKg, "kg") });
  if (lengthCm) rows.push({ label: "Comprimento", value: formatNumber(lengthCm, "cm") });
  if (widthCm) rows.push({ label: "Largura", value: formatNumber(widthCm, "cm") });
  if (heightCm) rows.push({ label: "Altura", value: formatNumber(heightCm, "cm") });

  if (rows.length === 0) return null;

  return (
    <details className="group border-y border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-[0.6875rem] uppercase tracking-[0.16em] outline-none transition-colors hover:text-[var(--gold)] focus-visible:text-[var(--gold)] [&::-webkit-details-marker]:hidden">
        Mais detalhes
        <span
          aria-hidden
          className="text-base leading-none transition-transform duration-300 group-open:rotate-45"
        >
          +
        </span>
      </summary>

      <dl className="flex flex-col divide-y divide-border/60 pb-2">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-6 py-2.5">
            <dt className="w-28 shrink-0 text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground">
              {row.label}
            </dt>
            <dd className="text-sm tabular-nums text-muted-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
