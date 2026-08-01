import { scryptSync, timingSafeEqual } from "node:crypto";
import { callSupabaseRpc } from "./supabase";

export type AdminIdentity = {
  id: number;
  email: string;
};

type AdminUserRow = {
  id: number | string;
  email: string;
  password_hash: string;
  active: boolean;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function findAdminByEmail(email: string) {
  const rows = await callSupabaseRpc<AdminUserRow[]>("hoza_admin_get_user_by_email", {
    p_email: normalizeEmail(email),
  });
  return rows[0];
}

export async function getActiveAdminById(id: number): Promise<AdminIdentity | null> {
  const rows = await callSupabaseRpc<Array<Pick<AdminUserRow, "id" | "email" | "active">>>(
    "hoza_admin_get_user_by_id",
    { p_id: id },
  );
  const row = rows[0];

  return row?.active ? { id: Number(row.id), email: row.email } : null;
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
      candidateHash.length !== storedHash.length ||
      !timingSafeEqual(candidateHash, storedHash)
    ) {
      return null;
    }

    return { id: Number(user.id), email: user.email };
  } catch {
    return null;
  }
}
