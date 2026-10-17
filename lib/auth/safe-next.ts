// Destino pós-confirmação vindo da URL (`?next=`). Só aceita caminho relativo
// do próprio site — nunca um endereço absoluto ou protocol-relative, que
// transformaria o link do e-mail num redirecionamento aberto para phishing.
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;

  // Precisa começar com uma única "/"; "//host" e "/\host" viram outro domínio
  // em alguns navegadores. Caracteres de controle também são recusados.
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\\]/.test(next)) return fallback;

  return next;
}
