import { describe, expect, it } from "vitest";
import { buildPixPayload, crc16, normalizePixKey } from "@/lib/pix/br-code";

describe("crc16", () => {
  // Vetor de referência do CRC16-CCITT (início 0xFFFF): "123456789" => 29B1.
  it("bate com o vetor padrão", () => {
    expect(crc16("123456789")).toBe("29B1");
  });
});

describe("normalizePixKey", () => {
  it("deixa o CNPJ só com dígitos", () => {
    expect(normalizePixKey("12.345.678/0001-95")).toBe("12345678000195");
    expect(normalizePixKey("12345678000195")).toBe("12345678000195");
  });

  it("reconhece e-mail, chave aleatória e telefone", () => {
    expect(normalizePixKey(" Loja@Email.com ")).toBe("loja@email.com");
    expect(normalizePixKey("123E4567-E89B-12D3-A456-426614174000")).toBe("123e4567-e89b-12d3-a456-426614174000");
    expect(normalizePixKey("(43) 99143-4124")).toBe("+5543991434124");
    expect(normalizePixKey("+55 43 99143-4124")).toBe("+5543991434124");
  });

  it("recusa o que não é chave", () => {
    expect(normalizePixKey("")).toBeNull();
    expect(normalizePixKey("abc")).toBeNull();
    expect(normalizePixKey("1234")).toBeNull();
  });
});

describe("buildPixPayload", () => {
  const payload = buildPixPayload({
    key: "12.345.678/0001-95",
    merchantName: "Blessing Collection Ateliê de Bolsas Artesanais",
    merchantCity: "Londrina",
  })!;

  it("monta os campos obrigatórios do BR Code", () => {
    expect(payload.startsWith("000201")).toBe(true);
    expect(payload).toContain("0014br.gov.bcb.pix0114" + "12345678000195");
    expect(payload).toContain("5303986");
    expect(payload).toContain("5802BR");
    expect(payload).toContain("6008LONDRINA");
    expect(payload).toContain("62070503***");
  });

  it("corta e limpa o nome para o limite do formato", () => {
    const name = payload.match(/59(\d{2})(.+?)60\d{2}/)!;
    expect(Number(name[1])).toBe(name[2].length);
    expect(name[2].length).toBeLessThanOrEqual(25);
    expect(name[2]).toMatch(/^[A-Z0-9 ]+$/);
  });

  it("termina com um CRC válido do próprio conteúdo", () => {
    const body = payload.slice(0, -4);
    expect(body.endsWith("6304")).toBe(true);
    expect(payload.slice(-4)).toBe(crc16(body));
  });

  it("usa BRASIL quando a cidade não está cadastrada e devolve null para chave inválida", () => {
    const semCidade = buildPixPayload({ key: "12345678000195", merchantName: "Loja", merchantCity: null })!;
    expect(semCidade).toContain("6006BRASIL");
    expect(buildPixPayload({ key: "xyz", merchantName: "Loja" })).toBeNull();
  });
});
