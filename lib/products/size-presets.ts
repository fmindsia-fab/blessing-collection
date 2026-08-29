import type { BusinessType } from "@/types/database.types";

/**
 * Sugestões de tamanho/numeração por tipo de negócio, para preencher o campo
 * "Nome" da variação com um clique. Puramente uma sugestão de UX — o valor
 * final continua texto livre em `product_variants.name`/`variant_group`
 * (nenhuma migration nova: ver PLAN.md M12).
 */
export const SIZE_PRESETS: Record<BusinessType, { group: string; values: string[] } | null> = {
  artisan: null,
  clothing: { group: "Tamanho", values: ["PP", "P", "M", "G", "GG", "XG"] },
  footwear: {
    group: "Numeração",
    values: ["33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"],
  },
};
