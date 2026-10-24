import { slugify } from "@/lib/utils";

/**
 * Nome e endereço (slug) livres para a cópia de uma peça: "Nome (cópia)", e se já existir,
 * "Nome (cópia 2)", "Nome (cópia 3)"… O endereço é único dentro da loja, então a conferência
 * é feita contra os endereços já usados por ela.
 */
export function nextCopyIdentity(
  originalName: string,
  existingSlugs: Iterable<string>,
): { name: string; slug: string } {
  const used = new Set(existingSlugs);

  for (let attempt = 1; attempt < 1000; attempt += 1) {
    const name = attempt === 1 ? `${originalName} (cópia)` : `${originalName} (cópia ${attempt})`;
    const slug = slugify(name);
    if (slug && !used.has(slug)) return { name, slug };
  }

  // Praticamente inalcançável; evita laço infinito e ainda devolve algo único.
  const suffix = Math.random().toString(36).slice(2, 8);
  const name = `${originalName} (cópia ${suffix})`;
  return { name, slug: slugify(name) };
}
