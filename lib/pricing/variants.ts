import { toCents } from "./money";

export type VariantOption = {
  id: string;
  name: string;
  price: number | null;
  status: string;
  variant_group: string | null;
};

export type VariantGroup = {
  name: string;
  options: VariantOption[];
};

/** Grupo das variações sem grupo definido. */
export const DEFAULT_VARIANT_GROUP = "Opções";

/**
 * Agrupa as variações preservando a ordem de cadastro.
 *
 * Um grupo reúne alternativas entre si — a cliente escolhe uma de cada. Sem
 * isso, escolher "Marrom" desmarcaria "Alça Corrente", quando na verdade ela
 * quer as duas.
 */
export function groupVariants(variants: VariantOption[]): VariantGroup[] {
  const groups = new Map<string, VariantOption[]>();

  for (const variant of variants) {
    const key = variant.variant_group?.trim() || DEFAULT_VARIANT_GROUP;
    groups.set(key, [...(groups.get(key) ?? []), variant]);
  }

  return [...groups.entries()].map(([name, options]) => ({ name, options }));
}

/**
 * Adicional de uma variação, em centavos.
 *
 * O painel guarda o preço TOTAL da peça com aquela variação, não o acréscimo:
 * é o número que a proprietária tem na cabeça ao precificar. O adicional sai
 * da diferença para o preço base.
 *
 * Nunca negativo: uma variação mais barata que a base seria desconto, e somar
 * um valor negativo às outras escolhas produziria um total confuso.
 */
export function variantSurchargeCents(variant: VariantOption, basePriceCents: number): number {
  if (variant.price == null) return 0;

  return Math.max(0, toCents(variant.price) - basePriceCents);
}

/**
 * Preço final com todas as escolhas somadas.
 *
 * Base + a soma dos adicionais. Escolher alça de corrente (+40) e bordado
 * (+25) numa peça de 369,90 dá 434,90.
 */
export function priceWithVariants(basePriceCents: number, selected: VariantOption[]): number {
  return selected.reduce(
    (total, variant) => total + variantSurchargeCents(variant, basePriceCents),
    basePriceCents,
  );
}

/**
 * Menor preço possível da peça — o "a partir de" exibido antes de escolher.
 *
 * É o preço base: qualquer combinação só acrescenta. Grupos cujas opções todas
 * têm adicional não são considerados obrigatórios, porque a cliente pode
 * conversar sobre a peça sem escolher.
 */
export function lowestPriceCents(basePriceCents: number): number {
  return basePriceCents;
}

/** Rótulo das escolhas para a mensagem: "Marrom, Alça Corrente". */
export function describeSelection(selected: VariantOption[]): string | null {
  if (selected.length === 0) return null;

  return selected.map((variant) => variant.name).join(", ");
}
