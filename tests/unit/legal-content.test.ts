import { describe, expect, it } from "vitest";
import { LEGAL_IDENTITY } from "@/lib/legal/identity";
import { PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/lib/legal/privacy-content";
import { TERMS_INTRO, TERMS_SECTIONS } from "@/lib/legal/terms-content";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal/versions";
import type { LegalSection } from "@/lib/legal/types";

function flatten(intro: string, sections: LegalSection[]) {
  return [
    intro,
    ...sections.flatMap((s) => [
      s.title,
      ...s.blocks.flatMap((b) => (b.type === "p" ? [b.text] : b.items)),
    ]),
  ].join("\n");
}

const terms = flatten(TERMS_INTRO, TERMS_SECTIONS);
const privacy = flatten(PRIVACY_INTRO, PRIVACY_SECTIONS);

describe("versões", () => {
  it("têm formato de data (AAAA-MM-DD), para registrar no aceite e comparar", () => {
    expect(TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(PRIVACY_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("Termos de Uso", () => {
  it("identificam o responsável (nome, CPF, cidade e e-mail) sem endereço residencial", () => {
    expect(terms).toContain(LEGAL_IDENTITY.responsibleName);
    expect(terms).toContain(LEGAL_IDENTITY.taxId);
    expect(terms).toContain("Londrina/PR");
    expect(terms).toContain(LEGAL_IDENTITY.contactEmail);
    expect(terms).not.toMatch(/\b(rua|avenida|av\.|cep)\b/i);
  });

  it("cobrem os pontos pedidos: teste de 30 dias, Stripe, renovação, cancelamento, arrependimento e fiscal", () => {
    expect(terms).toMatch(/30 dias de teste gratuito/);
    expect(terms).toMatch(/Stripe/);
    expect(terms).toMatch(/renova automaticamente/);
    expect(terms).toMatch(/cancelar a assinatura quando quiser/);
    expect(terms).toMatch(/7 \(sete\) dias corridos/);
    expect(terms).toMatch(/documentos fiscais serão fornecidos conforme as obrigações legais aplicáveis/);
    expect(terms).toMatch(/Código de Defesa do Consumidor/);
  });

  it("não afirmam que a fase de implantação dispensa nota fiscal e não excluem direitos do consumidor", () => {
    expect(terms).not.toMatch(/isent|dispens/i);
    expect(terms).toMatch(/Nada nestes Termos limita ou exclui direitos/);
  });

  it("têm seções com ids únicos (âncoras do índice)", () => {
    const ids = TERMS_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("Política de Privacidade", () => {
  it("cita os operadores realmente usados, a ANPD e o canal de contato", () => {
    for (const provider of ["Supabase", "Vercel", "Stripe", "Resend", "Cloudflare"]) {
      expect(privacy).toContain(provider);
    }
    expect(privacy).toMatch(/ANPD/);
    expect(privacy).toContain(LEGAL_IDENTITY.contactEmail);
  });

  it("distingue os dados dos assinantes (plataforma) dos dados dos compradores (lojas)", () => {
    expect(privacy).toMatch(/Somos o controlador/);
    expect(privacy).toMatch(/a própria loja, que é a controladora/);
    expect(privacy).toMatch(/operador/);
  });

  it("não promete segurança, backup ou prazos que não existem", () => {
    expect(privacy).not.toMatch(/backup|cópia de segurança|criptografia de ponta|ISO ?27001|100% seguro/i);
    // Admite com todas as letras que não há exclusão automática nem prazo definido.
    expect(privacy).toMatch(/não existe exclusão automática/);
    expect(privacy).toMatch(/Ainda não definimos um prazo automático/);
  });

  it("declara que não vende dados nem usa cookies de publicidade", () => {
    expect(privacy).toMatch(/Não vendemos dados pessoais/);
    expect(privacy).toMatch(/Não usamos cookies de publicidade/);
  });
});
