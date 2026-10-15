// Mostrada ao visitante quando a loja não tem acesso comercial (trial
// expirado, assinatura vencida). Propositalmente sem nenhum detalhe de
// cobrança — o visitante não precisa saber o motivo.
export function CatalogUnavailable({ storeName }: { storeName: string }) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <span className="text-sm font-medium text-muted-foreground">{storeName}</span>
        <h1 className="text-2xl font-semibold tracking-tight">
          Este catálogo está temporariamente indisponível
        </h1>
        <p className="text-sm text-muted-foreground">Volte em breve.</p>
      </div>
    </main>
  );
}
