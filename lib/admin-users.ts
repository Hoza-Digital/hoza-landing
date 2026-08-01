import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { callSupabaseRpc } from "./supabase";

export const ADMIN_ROLES = ["super_admin", "admin", "marketing", "writer"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  marketing: "Marketing",
  writer: "Content Writer",
};

export type AdminIdentity = {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
};

export type ManagedAdminUser = AdminIdentity & {
  active: boolean;
  createdAt: string;
};

type AdminUserRow = {
  id: number | string;
  name: string;
  email: string;
  role: AdminRole;
  password_hash: string;
  active: boolean;
  created_at?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toIdentity(row: Pick<AdminUserRow, "id" | "name" | "email" | "role">): AdminIdentity {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
  };
}

async function findAdminByEmail(email: string) {
  const rows = await callSupabaseRpc<AdminUserRow[]>("hoza_admin_get_user_by_email", {
    p_email: normalizeEmail(email),
  });
  return rows[0];
}

export async function getActiveAdminById(id: number): Promise<AdminIdentity | null> {
  const rows = await callSupabaseRpc<AdminUserRow[]>("hoza_admin_get_user_by_id", { p_id: id });
  const row = rows[0];
  return row?.active ? toIdentity(row) : null;
}

export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<AdminIdentity | null> {
  const user = await findAdminByEmail(email);
  if (!user?.active) return null;

  const [algorithm, encodedSalt, encodedHash] = user.password_hash.split("$");
  if (algorithm !== "scrypt" || !encodedSalt || !encodedHash) return null;

  try {
    const salt = Buffer.from(encodedSalt, "base64url");
    const storedHash = Buffer.from(encodedHash, "base64url");
    const candidateHash = scryptSync(password, salt, storedHash.length);

    if (
      candidateHash.length !== storedHash.length
      || !timingSafeEqual(candidateHash, storedHash)
    ) {
      return null;
    }

    return toIdentity(user);
  } catch {
    return null;
  }
}

export function hashAdminPassword(password: string) {
  const salt = randomBytes(16);
  const passwordHash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${passwordHash.toString("base64url")}`;
}

export function creatableRoles(role: AdminRole): AdminRole[] {
  if (role === "super_admin") return [...ADMIN_ROLES];
  if (role === "admin") return ["admin", "marketing", "writer"];
  return [role];
}

export function canAccessProjectSignals(role: AdminRole) {
  return role !== "writer";
}

export function canAccessArticleProduction(role: AdminRole) {
  return role !== "marketing";
}

export function canDeleteManagedUser(actorRole: AdminRole, targetRole: AdminRole) {
  if (targetRole === "super_admin") return false;
  if (actorRole === "super_admin") return true;
  return actorRole === "admin" && (targetRole === "marketing" || targetRole === "writer");
}

export function canChangeManagedRole(actorRole: AdminRole, targetRole: AdminRole) {
  if (targetRole === "super_admin") return false;
  if (actorRole === "super_admin") return true;
  return actorRole === "admin" && (targetRole === "marketing" || targetRole === "writer");
}

export async function listManagedAdminUsers(
  actor: Pick<AdminIdentity, "id" | "role">,
): Promise<ManagedAdminUser[]> {
  const rows = await callSupabaseRpc<AdminUserRow[]>("hoza_admin_list_users", {
    p_actor_id: actor.id,
  });
  const visibleRows = rows.filter((row) => {
    if (actor.role === "super_admin") return true;
    if (actor.role === "admin") return row.role !== "super_admin";
    return row.role === actor.role;
  });

  return visibleRows.map((row) => ({
    ...toIdentity(row),
    active: row.active,
    createdAt: row.created_at ?? "",
  }));
}

export async function createManagedAdminUser(input: {
  actorId: number;
  name: string;
  email: string;
  role: AdminRole;
  passwordHash: string;
}) {
  return await callSupabaseRpc<number>("hoza_admin_create_user", {
    p_actor_id: input.actorId,
    p_name: input.name,
    p_email: normalizeEmail(input.email),
    p_role: input.role,
    p_password_hash: input.passwordHash,
  });
}

export async function updateManagedAdminRole(actorId: number, targetId: number, role: AdminRole) {
  await callSupabaseRpc<void>("hoza_admin_update_user_role", {
    p_actor_id: actorId,
    p_target_id: targetId,
    p_role: role,
  });
}

export async function deleteManagedAdminUser(actorId: number, targetId: number) {
  await callSupabaseRpc<void>("hoza_admin_delete_user", {
    p_actor_id: actorId,
    p_target_id: targetId,
  });
}
