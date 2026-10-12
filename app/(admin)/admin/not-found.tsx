// Cobre o caso de getActiveStore() não encontrar a loja com status='active'
// — hoje isso é quase sempre assinatura vencida/trial expirado (ver
// store_subscriptions), não uma rota digitada errada. A RLS já bloqueia os
// dados; esta página só explica o motivo em vez de deixar um 404 genérico.
export default function AdminNotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <h1 className="text-2xl tracking-tight">Assinatura pendente</h1>
        <p className="text-sm text-muted-foreground">
          Não encontramos uma assinatura ativa para esta loja. Se você acabou de assinar, aguarde
          alguns instantes e atualize a página — ou entre em contato com o suporte.
        </p>
      </div>
    </main>
  );
}
