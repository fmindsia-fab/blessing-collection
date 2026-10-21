import { describe, expect, it } from "vitest";
import { normalizeUserAgent, parseClientIp } from "@/lib/legal/evidence";

describe("parseClientIp", () => {
  it("usa o primeiro IP de x-forwarded-for (o do cliente) e cai em x-real-ip", () => {
    expect(parseClientIp("201.10.20.30, 76.76.21.21", null)).toBe("201.10.20.30");
    expect(parseClientIp(null, "201.10.20.30")).toBe("201.10.20.30");
    expect(parseClientIp("2804:14d:1234::1", null)).toBe("2804:14d:1234::1");
  });

  it("descarta valor ausente, enorme ou com caracteres que não são de IP", () => {
    expect(parseClientIp(null, null)).toBeNull();
    expect(parseClientIp("<script>alert(1)</script>", null)).toBeNull();
    expect(parseClientIp("1".repeat(80), null)).toBeNull();
  });
});

describe("normalizeUserAgent", () => {
  it("limita o tamanho, tira caracteres de controle e devolve null se vazio", () => {
    expect(normalizeUserAgent("Mozilla/5.0\nX")).toBe("Mozilla/5.0 X");
    expect(normalizeUserAgent("a".repeat(500))).toHaveLength(300);
    expect(normalizeUserAgent("   ")).toBeNull();
    expect(normalizeUserAgent(null)).toBeNull();
  });
});
