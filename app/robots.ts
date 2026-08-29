import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Painel, login e cadastro não têm valor de busca e não devem aparecer
      // em resultados. Não é controle de acesso — isso é a RLS; é só higiene
      // de indexação. /loja/*/selecao depende do localStorage do visitante,
      // então indexá-la traria uma página sempre vazia, para qualquer loja.
      disallow: ["/admin", "/admin/", "/login", "/cadastro", "/loja/*/selecao"],
    },
    sitemap: siteUrl ? `${siteUrl.replace(/\/+$/, "")}/sitemap.xml` : undefined,
  };
}
