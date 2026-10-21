// Evidências técnicas proporcionais do aceite: IP e navegador, quando disponíveis.
// Funções puras (sem I/O) para serem testáveis.

const MAX_IP_LENGTH = 64;
const MAX_USER_AGENT_LENGTH = 300;

// No Vercel, x-forwarded-for traz o IP real do cliente (a plataforma o define, não o
// visitante). Pode vir como "cliente, proxy1, proxy2": o primeiro é o cliente.
// Tratamos o valor como DADO DE LOG: só aceitamos caracteres de IP e limitamos o tamanho.
export function parseClientIp(forwardedFor: string | null, realIp: string | null): string | null {
  const first = (forwardedFor ?? "").split(",")[0]?.trim() || (realIp ?? "").trim();
  if (!first || first.length > MAX_IP_LENGTH) return null;
  return /^[0-9a-fA-F:.]+$/.test(first) ? first : null;
}

export function normalizeUserAgent(userAgent: string | null): string | null {
  const value = (userAgent ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return value ? value.slice(0, MAX_USER_AGENT_LENGTH) : null;
}
