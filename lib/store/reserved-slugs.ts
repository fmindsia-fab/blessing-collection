// Slugs bloqueados no cadastro de loja: colidem com rotas do sistema
// (mesmo fora do prefixo /loja/) e gerariam URLs confusas ou phishing-like
// (ex: /loja/admin/produtos parece oficial mas não é).
const RESERVED_SLUGS = new Set([
  "admin",
  "login",
  "cadastro",
  "api",
  "_next",
  "loja",
  "produtos",
  "categorias",
  "colecoes",
  "selecao",
  "sitemap.xml",
  "robots.txt",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
