/**
 * Máscara de telefone BR: (11) 91234-5678 (celular) ou (11) 1234-5678 (fixo).
 * Formata pelo total de dígitos já digitados, então funciona enquanto o
 * usuário ainda está digitando, sem exigir o número completo.
 */
export function formatPhoneBR(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Máscara do WhatsApp da loja: (99) 99999-9999. Aceita números já salvos com
 * DDI 55 (ex.: 5543999999999) e mostra só DDD + número.
 */
export function formatWhatsappBR(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);
  return formatPhoneBR(digits);
}

/**
 * Normaliza para o formato que o link wa.me exige: DDI 55 + DDD + número.
 * Devolve null se não for um número brasileiro de 10 ou 11 dígitos.
 */
export function normalizeWhatsappBR(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const national = digits.length >= 12 && digits.startsWith("55") ? digits.slice(2) : digits;
  if (national.length !== 10 && national.length !== 11) return null;
  return `55${national}`;
}
