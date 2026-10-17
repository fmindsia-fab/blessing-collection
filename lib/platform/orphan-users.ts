// "Login órfão": usuário do Auth que não é dono de nenhuma loja nem
// administrador da plataforma. Acontece quando a loja é apagada (ou o cadastro
// é abandonado) mas o login continua existindo — e então o mesmo e-mail não
// consegue se cadastrar de novo ("já tem uma conta"). Função pura, testável.

export type AuthUserLite = {
  id: string;
  email: string | null;
  created_at: string;
  confirmed: boolean;
};

export type OrphanUser = AuthUserLite & {
  ageHours: number;
  // Criado há pouco: pode ser um cadastro em andamento (conta criada, loja
  // ainda não) ou aguardando confirmação de e-mail. Não entra na limpeza em lote.
  isRecent: boolean;
};

export const STALE_ORPHAN_HOURS = 24;

const HOUR_MS = 60 * 60 * 1000;

export function findOrphanUsers(
  users: AuthUserLite[],
  ownerIds: ReadonlySet<string>,
  adminIds: ReadonlySet<string>,
  now: Date,
): OrphanUser[] {
  return users
    .filter((user) => !ownerIds.has(user.id) && !adminIds.has(user.id))
    .map((user) => {
      const ageHours = (now.getTime() - new Date(user.created_at).getTime()) / HOUR_MS;
      return { ...user, ageHours, isRecent: ageHours < STALE_ORPHAN_HOURS };
    })
    .sort((a, b) => b.ageHours - a.ageHours);
}
