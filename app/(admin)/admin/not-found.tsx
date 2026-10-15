// getActiveStore() só encontra lojas com stores.status='active'. Trial
// expirado ou assinatura vencida NÃO chegam aqui (o acesso comercial é tratado
// por store_has_access e o /admin continua aberto) — este 404 cobre loja
// suspensa pela plataforma (bloqueio administrativo) ou rota digitada errada.
export default function AdminNotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <h1 className="text-2xl tracking-tight">Loja indisponível</h1>
        <p className="text-sm text-muted-foreground">
          Esta loja não está disponível no momento. Se você acredita que isso é um engano, entre em
          contato com o suporte.
        </p>
      </div>
    </main>
  );
}
