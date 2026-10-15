import { getStoreOwnership } from "@/lib/store/ownership";

// Aviso fixo no topo do painel quando a conta logada não é a dona da loja
// (ex.: o administrador da plataforma abrindo o painel de um cliente). O
// painel carrega, mas qualquer alteração é recusada pela RLS — então deixa
// claro que está em modo somente leitura.
export async function OwnershipBanner({ store }: { store: { owner_user_id: string } }) {
  const ownership = await getStoreOwnership(store);
  if (!ownership.known || ownership.isOwner) return null;

  return (
    <div
      role="alert"
      className="border-b border-destructive/30 bg-destructive/10 px-6 py-3 text-sm lg:px-10"
    >
      <strong className="font-semibold">Modo somente leitura.</strong>{" "}
      Você está logado{ownership.userEmail ? ` como ${ownership.userEmail}` : ""}, que não é a conta dona desta
      loja. Alterações não serão salvas — saia e entre com a conta da loja.
    </div>
  );
}
