import { isValidCpf } from "@/lib/br/document";

// "Pix copia e cola" estático (BR Code do Banco Central): o texto que os aplicativos
// de banco leem no QR Code. Um QR que contivesse só o CNPJ não seria reconhecido como
// Pix; é preciso o payload EMV abaixo, com o CRC16 no fim.

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Chave como o banco espera: CPF/CNPJ só com dígitos, telefone com +55, e-mail em
 * minúsculas, chave aleatória como está. Devolve null se não der para reconhecer.
 */
export function normalizePixKey(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  if (value.includes("@")) return value.toLowerCase();
  if (UUID_REGEX.test(value)) return value.toLowerCase();

  const digits = value.replace(/\D/g, "");
  if (value.startsWith("+")) return digits.length >= 12 ? `+${digits}` : null;
  if (digits.length === 14) return digits; // CNPJ
  if (digits.length === 11) return isValidCpf(digits) ? digits : `+55${digits}`; // CPF ou celular
  if (digits.length === 10) return `+55${digits}`;
  return null;
}

/** Campo EMV: id (2 dígitos) + tamanho (2 dígitos) + valor. */
function field(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

/** Nome e cidade do BR Code: sem acento, só ASCII, em maiúsculas e no tamanho máximo. */
function asciiUpper(value: string, max: number): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, max)
    .trim();
}

/** CRC16-CCITT (polinômio 0x1021, início 0xFFFF), em 4 caracteres hexadecimais maiúsculos. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Pix estático sem valor (o cliente digita quanto vai pagar). Devolve null se a chave
 * não for reconhecida. A cidade é obrigatória no formato; sem ela usa "BRASIL".
 */
export function buildPixPayload({
  key,
  merchantName,
  merchantCity,
}: {
  key: string;
  merchantName: string;
  merchantCity?: string | null;
}): string | null {
  const normalizedKey = normalizePixKey(key);
  if (!normalizedKey) return null;

  const name = asciiUpper(merchantName, 25) || "LOJA";
  const city = asciiUpper(merchantCity ?? "", 15) || "BRASIL";

  const body =
    field("00", "01") +
    field("26", field("00", "br.gov.bcb.pix") + field("01", normalizedKey)) +
    field("52", "0000") +
    field("53", "986") +
    field("58", "BR") +
    field("59", name) +
    field("60", city) +
    field("62", field("05", "***")) +
    "6304";

  return body + crc16(body);
}
