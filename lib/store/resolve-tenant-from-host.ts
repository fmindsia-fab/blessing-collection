import { RESERVED_SLUGS } from "@/lib/store/reserved-slugs";

export type TenantFromHost =
  | { kind: "tenant"; slug: string }
  | { kind: "tenant-domain"; domain: string }
  | { kind: "none" };

// Domínio apex da própria plataforma (ex.: atelifacil.com.br). Único lugar
// que lê PLATFORM_DOMAIN — resolveTenantFromHost é chamada só pelo proxy.ts.
function getPlatformDomain(): string | null {
  return process.env.PLATFORM_DOMAIN ?? null;
}

// Decide, a partir do host bruto de uma requisição, qual loja (se alguma)
// deve ser servida:
// - subdomínio de PLATFORM_DOMAIN (ex. mariabolsas.atelifacil.com.br) -> tenant por slug
// - apex ou "www" de PLATFORM_DOMAIN -> none (site institucional da plataforma)
// - qualquer outro host (ex. blessing.com.br) -> tenant-domain, resolvido depois via store_domains
export function resolveTenantFromHost(rawHost: string | null): TenantFromHost {
  if (!rawHost) return { kind: "none" };

  const host = rawHost.split(":")[0].toLowerCase();
  const platformDomain = getPlatformDomain();

  if (platformDomain && (host === platformDomain || host === `www.${platformDomain}`)) {
    return { kind: "none" };
  }

  if (platformDomain && host.endsWith(`.${platformDomain}`)) {
    const slug = host.slice(0, -(`.${platformDomain}`.length));
    if (!slug || slug.includes(".") || RESERVED_SLUGS.has(slug)) {
      return { kind: "none" };
    }
    return { kind: "tenant", slug };
  }

  return { kind: "tenant-domain", domain: host };
}
