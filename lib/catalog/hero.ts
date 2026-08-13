type HeroCandidate = {
  id: string;
  slug: string;
  name: string;
  cover_image_url: string | null;
};

/**
 * Sorteia a peça que ilustra a capa da home.
 *
 * Fica fora do componente porque `Math.random()` torna a função impura: no
 * corpo de um componente, o React Compiler pode memoizar o resultado e o
 * sorteio congelaria na primeira peça.
 *
 * O sorteio acontece no servidor, não no client, para a imagem já vir pronta
 * no HTML — sortear após a hidratação trocaria a foto na frente da cliente e
 * desperdiçaria o carregamento da primeira.
 *
 * Destaques primeiro, lançamentos depois, sem repetir peça que esteja nos
 * dois grupos. Peça sem foto de capa nunca entra: a seção depende da imagem.
 */
export function pickHeroProduct<T extends HeroCandidate>(
  featured: T[],
  newArrivals: T[],
): T | null {
  const seen = new Set<string>();
  const candidates = [...featured, ...newArrivals].filter((product) => {
    if (!product.cover_image_url || seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });

  if (candidates.length === 0) return null;

  return candidates[Math.floor(Math.random() * candidates.length)];
}
