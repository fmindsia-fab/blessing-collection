// Busca do catálogo: cada palavra digitada precisa aparecer no nome, na descrição, nos materiais
// ou no nome da categoria/coleção/modelo da peça, ignorando acento e maiúscula. A cliente digita
// "alca" e acha "Alça"; digita "bolsa couro" e acha "Bolsa de couro" mesmo se a palavra "couro"
// estiver só nos materiais.
//
// O banco não tem a extensão de acentos, então o casamento é feito por expressão regular com
// classes de letras acentuadas (ver `accentInsensitivePattern`). Como o valor vai para um filtro
// do PostgREST, o texto digitado é reduzido a letras, números e espaços: nada de caracteres que
// quebrem a sintaxe do filtro ou mudem o sentido da expressão.

const MAX_TOKENS = 4;
const MIN_TOKEN_LENGTH = 2;

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Palavras da busca: minúsculas, sem acento, só letras e números, sem repetir, no máximo 4. */
export function searchTokens(search: string | undefined | null): string[] {
  if (!search) return [];

  const tokens = stripAccents(search.toLowerCase())
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= MIN_TOKEN_LENGTH);

  return [...new Set(tokens)].slice(0, MAX_TOKENS);
}

const ACCENT_CLASSES: Record<string, string> = {
  a: "[aáàâãä]",
  c: "[cç]",
  e: "[eéèêë]",
  i: "[iíìîï]",
  n: "[nñ]",
  o: "[oóòôõö]",
  u: "[uúùûü]",
};

/**
 * Expressão regular (para o operador `imatch`, que ignora maiúsculas) que casa a palavra com ou
 * sem acento: "alca" vira "al[cç][aáàâãä]". Recebe uma palavra já limpa por `searchTokens`.
 */
export function accentInsensitivePattern(token: string): string {
  return [...token].map((char) => ACCENT_CLASSES[char] ?? char).join("");
}
