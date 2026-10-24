import { toCents } from "./money";

export type VariantOption = {
  id: string;
  name: string;
  price: number | null;
  status: string;
  variant_group: string | null;
  /** Escolha obrigatória: a cliente precisa escolher uma das obrigatórias do grupo. Ausente/false = complemento. */
  is_required?: boolean;
  /** Tom da cor cadastrada (a bolinha no catálogo); ausente quando a variação não tem cor. */
  color_hex?: string | null;
  color_hex_secondary?: string | null;
};

export type VariantGroup = {
  /** Identifica o conjunto de escolha (nome do grupo + obrigatória ou complemento). Use como chave. */
  key: string;
  /** Nome do grupo cadastrado (ex.: "Alça"). */
  name: string;
  /** Título para mostrar: "Alça", ou "Alça · complementos" quando o grupo também tem opções obrigatórias. */
  label: string;
  /** Conjunto de escolha obrigatória: a cliente precisa escolher uma opção. */
  required: boolean;
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
 *
 * Dentro do mesmo nome de grupo, as variações de escolha obrigatória e os
 * complementos formam conjuntos SEPARADOS: a cliente escolhe uma alça
 * obrigatória (madeira ou metal) e, se quiser, um complemento (tiracolo). Os
 * conjuntos obrigatórios vêm primeiro.
 */
export function groupVariants(variants: VariantOption[]): VariantGroup[] {
  const sets = new Map<string, VariantGroup>();

  for (const variant of variants) {
    const name = variant.variant_group?.trim() || DEFAULT_VARIANT_GROUP;
    const required = Boolean(variant.is_required);
    const key = `${name}::${required ? "obrigatoria" : "complemento"}`;

    const existing = sets.get(key);
    if (existing) existing.options.push(variant);
    else sets.set(key, { key, name, label: name, required, options: [variant] });
  }

  const all = [...sets.values()];
  const namesWithRequired = new Set(all.filter((group) => group.required).map((group) => group.name));

  for (const group of all) {
    if (!group.required && namesWithRequired.has(group.name)) group.label = `${group.name} · complementos`;
  }

  // Ordenação estável: obrigatórias primeiro, cada bloco na ordem em que foi cadastrado.
  return [...all.filter((group) => group.required), ...all.filter((group) => !group.required)];
}

/** Nomes dos conjuntos obrigatórios que ainda não têm escolha (ignora os que só têm opção esgotada). */
export function missingRequiredGroups(groups: VariantGroup[], chosenByKey: Record<string, string>): VariantGroup[] {
  return groups.filter(
    (group) =>
      group.required && !chosenByKey[group.key] && group.options.some((option) => option.status !== "sold_out"),
  );
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
