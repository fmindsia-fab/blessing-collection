import { describe, expect, it, vi } from "vitest";

describe("resolveTenantFromHost", () => {
  it("resolve subdomínio da plataforma como tenant por slug", async () => {
    vi.resetModules();
    process.env.PLATFORM_DOMAIN = "atelifacil.com.br";
    const { resolveTenantFromHost } = await import("@/lib/store/resolve-tenant-from-host");

    expect(resolveTenantFromHost("mariabolsas.atelifacil.com.br")).toEqual({
      kind: "tenant",
      slug: "mariabolsas",
    });
  });

  it("trata porta no host sem afetar o slug", async () => {
    vi.resetModules();
    process.env.PLATFORM_DOMAIN = "atelifacil.com.br";
    const { resolveTenantFromHost } = await import("@/lib/store/resolve-tenant-from-host");

    expect(resolveTenantFromHost("mariabolsas.atelifacil.com.br:3000")).toEqual({
      kind: "tenant",
      slug: "mariabolsas",
    });
  });

  it("trata apex e www do domínio da plataforma como site institucional (none)", async () => {
    vi.resetModules();
    process.env.PLATFORM_DOMAIN = "atelifacil.com.br";
    const { resolveTenantFromHost } = await import("@/lib/store/resolve-tenant-from-host");

    expect(resolveTenantFromHost("atelifacil.com.br")).toEqual({ kind: "none" });
    expect(resolveTenantFromHost("www.atelifacil.com.br")).toEqual({ kind: "none" });
  });

  it("rejeita subdomínios reservados como se não fossem loja alguma", async () => {
    vi.resetModules();
    process.env.PLATFORM_DOMAIN = "atelifacil.com.br";
    const { resolveTenantFromHost } = await import("@/lib/store/resolve-tenant-from-host");

    expect(resolveTenantFromHost("admin.atelifacil.com.br")).toEqual({ kind: "none" });
    expect(resolveTenantFromHost("api.atelifacil.com.br")).toEqual({ kind: "none" });
  });

  it("trata qualquer outro host como candidato a domínio customizado", async () => {
    vi.resetModules();
    process.env.PLATFORM_DOMAIN = "atelifacil.com.br";
    const { resolveTenantFromHost } = await import("@/lib/store/resolve-tenant-from-host");

    expect(resolveTenantFromHost("blessing.com.br")).toEqual({
      kind: "tenant-domain",
      domain: "blessing.com.br",
    });
  });

  it("sem host, não resolve tenant algum", async () => {
    vi.resetModules();
    process.env.PLATFORM_DOMAIN = "atelifacil.com.br";
    const { resolveTenantFromHost } = await import("@/lib/store/resolve-tenant-from-host");

    expect(resolveTenantFromHost(null)).toEqual({ kind: "none" });
  });
});
