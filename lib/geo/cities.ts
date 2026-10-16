"use server";

import { BR_STATES } from "@/lib/store/craft-profile";

// Municípios por UF vindos da API pública do IBGE (sem chave). Roda no
// servidor para o Next cachear a resposta (a lista praticamente não muda) e
// para o navegador não depender de CORS/CSP de terceiros. A UF é validada
// contra a lista fixa antes de montar a URL. Se a API falhar, devolve lista
// vazia e o formulário segue aceitando a cidade digitada à mão.
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function listCitiesByState(uf: string): Promise<string[]> {
  if (!(BR_STATES as readonly string[]).includes(uf)) return [];

  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
      { next: { revalidate: THIRTY_DAYS } },
    );
    if (!response.ok) return [];

    const municipalities = (await response.json()) as { nome?: unknown }[];
    return municipalities
      .map((m) => (typeof m.nome === "string" ? m.nome : ""))
      .filter((name) => name.length > 0);
  } catch {
    return [];
  }
}
