// Ligação entre a "variação" de uma peça (ex.: Alça) e o cadastro de materiais: ao escolher
// uma variação, a tela lista os materiais cujo nome começa a palavra com ela e soma o preço
// do material escolhido ao preço da peça. É só um valor inicial: a pessoa pode ajustar.

export type CatalogMaterial = {
  id: string;
  name: string;
  unit: string;
  unit_cost: number;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Variação curta demais ("Cor") casaria com "Corrente" ou "Cordão": só vale a partir de 4 letras.
const MIN_VARIATION_LENGTH = 4;

/**
 * Materiais cujo nome tem a variação como início de palavra, sem ligar para acento ou
 * maiúscula: "Alça" acha "Alça de couro", "Tiracolo alças" e "Alca"; não acha "Calça".
 */
export function findMaterialsForVariation(variation: string, materials: CatalogMaterial[]): CatalogMaterial[] {
  const needle = normalize(variation);
  if (needle.length < MIN_VARIATION_LENGTH) return [];

  const pattern = new RegExp(`(^|\\s)${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  return materials.filter((material) => pattern.test(normalize(material.name)));
}

/** Preço da peça + preço do material, em reais com duas casas (sem erro de ponto flutuante). */
export function priceWithMaterial(basePrice: number, materialUnitCost: number): number {
  return Math.round((basePrice + materialUnitCost) * 100) / 100;
}
