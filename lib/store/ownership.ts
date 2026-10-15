import { createServerSupabaseClient } from "@/lib/supabase/server";

// A RLS é quem barra escrita de quem não é dono da loja (auth.uid() =
// owner_user_id). Estas funções não são controle de acesso: só transformam
// esse bloqueio silencioso ("Não foi possível criar…") em uma explicação clara
// — e alimentam o aviso de modo somente leitura no painel.

export const NOT_OWNER_MESSAGE =
  "Você está logado com outra conta, que não é a dona desta loja. Saia e entre com a conta da loja para fazer alterações.";

export type StoreOwnership =
  | { known: false }
  | { known: true; isOwner: boolean; userEmail: string | null };

export async function getStoreOwnership(store: { owner_user_id?: string | null }): Promise<StoreOwnership> {
  if (!store.owner_user_id) return { known: false };

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { known: false };

    return { known: true, isOwner: user.id === store.owner_user_id, userEmail: user.email ?? null };
  } catch {
    return { known: false };
  }
}

// Mensagem para devolver numa server action de escrita, ou null se está tudo
// certo (ou se não deu para saber — nesse caso a RLS segue valendo).
export async function getNotOwnerError(store: { owner_user_id?: string | null }): Promise<string | null> {
  const ownership = await getStoreOwnership(store);
  return ownership.known && !ownership.isOwner ? NOT_OWNER_MESSAGE : null;
}
