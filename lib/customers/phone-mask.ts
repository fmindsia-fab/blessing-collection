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
