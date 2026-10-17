import "server-only";
import { createPlatformServiceClient } from "@/lib/platform/service-role-client";
import { findOrphanUsers, type AuthUserLite, type OrphanUser } from "@/lib/platform/orphan-users";

type ServiceClient = ReturnType<typeof createPlatformServiceClient>;

const PER_PAGE = 200;
const MAX_PAGES = 25; // teto de segurança: 5.000 usuários

// Só chamar depois de isPlatformAdmin() — usa a service_role para listar o Auth.
export async function loadOrphanUsers(client: ServiceClient, now: Date): Promise<OrphanUser[]> {
  const users: AuthUserLite[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) throw new Error(error.message);

    for (const user of data.users) {
      users.push({
        id: user.id,
        email: user.email ?? null,
        created_at: user.created_at,
        confirmed: Boolean(user.email_confirmed_at),
      });
    }
    if (data.users.length < PER_PAGE) break;
  }

  const [{ data: stores }, { data: admins }] = await Promise.all([
    client.from("stores").select("owner_user_id"),
    client.from("profiles").select("id").eq("is_platform_admin", true),
  ]);

  return findOrphanUsers(
    users,
    new Set((stores ?? []).map((s) => s.owner_user_id)),
    new Set((admins ?? []).map((p) => p.id)),
    now,
  );
}
