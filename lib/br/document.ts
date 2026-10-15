// CPF/CNPJ: validação pelos dígitos verificadores e máscara progressiva.

export function isValidCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  const check = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(digits[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === Number(digits[9]) && check(10) === Number(digits[10]);
}

const CNPJ_WEIGHTS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_WEIGHTS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export function isValidCnpj(digits: string): boolean {
  if (!/^\d{14}$/.test(digits) || /^(\d)\1{13}$/.test(digits)) return false;
  const check = (weights: number[]) => {
    const sum = weights.reduce((acc, w, i) => acc + Number(digits[i]) * w, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return check(CNPJ_WEIGHTS_1) === Number(digits[12]) && check(CNPJ_WEIGHTS_2) === Number(digits[13]);
}

export function isValidCpfOrCnpj(digits: string): boolean {
  return digits.length === 14 ? isValidCnpj(digits) : isValidCpf(digits);
}

/**
 * Máscara progressiva: até 11 dígitos usa 999.999.999-99 (CPF); a partir do
 * 12º dígito muda para 99.999.999/9999-99 (CNPJ).
 */
export function formatCpfCnpj(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);

  if (d.length <= 11) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }

  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}
