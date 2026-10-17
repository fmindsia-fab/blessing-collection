import { describe, expect, it } from "vitest";
import { findOrphanUsers, type AuthUserLite } from "@/lib/platform/orphan-users";

const NOW = new Date("2026-10-17T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();

const user = (id: string, createdHoursAgo: number, confirmed = true): AuthUserLite => ({
  id,
  email: `${id}@teste.com`,
  created_at: hoursAgo(createdHoursAgo),
  confirmed,
});

describe("findOrphanUsers", () => {
  it("nunca lista dono de loja nem administrador da plataforma", () => {
    const users = [user("dono", 500), user("admin", 500), user("sem-loja", 500)];

    const orphans = findOrphanUsers(users, new Set(["dono"]), new Set(["admin"]), NOW);

    expect(orphans.map((u) => u.id)).toEqual(["sem-loja"]);
  });

  it("marca como recente quem foi criado há menos de 24 h (cadastro em andamento)", () => {
    const orphans = findOrphanUsers([user("novo", 2), user("antigo", 48)], new Set(), new Set(), NOW);

    expect(orphans.find((u) => u.id === "novo")?.isRecent).toBe(true);
    expect(orphans.find((u) => u.id === "antigo")?.isRecent).toBe(false);
  });

  it("ordena do mais antigo para o mais novo", () => {
    const orphans = findOrphanUsers(
      [user("b", 30), user("a", 300), user("c", 5)],
      new Set(),
      new Set(),
      NOW,
    );

    expect(orphans.map((u) => u.id)).toEqual(["a", "b", "c"]);
  });
});
