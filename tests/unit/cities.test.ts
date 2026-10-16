import { afterEach, describe, expect, it, vi } from "vitest";
import { listCitiesByState } from "@/lib/geo/cities";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listCitiesByState", () => {
  it("devolve os nomes dos municípios da UF, na ordem da API", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [{ nome: "Cambé" }, { nome: "Londrina" }, { id: 1 }],
    }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await listCitiesByState("PR")).toEqual(["Cambé", "Londrina"]);
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain("/estados/PR/municipios");
  });

  it("recusa UF fora da lista sem chamar a API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await listCitiesByState("XX")).toEqual([]);
    expect(await listCitiesByState("../etc")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devolve lista vazia se a API falhar, para o formulário aceitar texto livre", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => [] })));
    expect(await listCitiesByState("SP")).toEqual([]);

    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("rede");
    }));
    expect(await listCitiesByState("SP")).toEqual([]);
  });
});
