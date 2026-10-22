// Bloco da tela de Configurações: cartão com âncora (#id) para o menu de seções do topo.
export function SettingsSection({
  id,
  title,
  children,
}: {
  id: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      {title ? <h2 className="mb-5 text-xl font-semibold tracking-tight">{title}</h2> : null}
      {children}
    </section>
  );
}
