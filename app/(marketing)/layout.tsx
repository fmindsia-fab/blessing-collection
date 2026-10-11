// Área institucional da plataforma (apex/www do PLATFORM_DOMAIN) — não tem
// marca de loja nenhuma, por isso não usa SiteFooter/SelectionProvider do
// (public), que dependem de uma loja ativa (getActiveStore).
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
