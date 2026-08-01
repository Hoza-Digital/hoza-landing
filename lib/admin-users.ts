import { scryptSync, timingSafeEqual } from "node:crypto";
import { getDatabase } from "./database";

export type AdminIdentity = {
  id: number;
  email: string;
};

type AdminUserRow = {
  id: number;
  email: string;
  password_hash: string;
  active: number;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function findAdminByEmail(email: string) {
  return getDatabase()
    .prepare(`
      SELECT id, email, password_hash, active
      FROM admin_users
      WHERE email = ? COLLATE NOCASE
      LIMIT 1
    `)
    .get(normalizeEmail(email)) as unknown as AdminUserRow | undefined;
}

export function getActiveAdminById(id: number): AdminIdentity | null {
  const row = getDatabase()
    .prepare("SELECT id, email FROM admin_users WHERE id = ? AND active = 1 LIMIT 1")
    .get(id) as unknown as Pick<AdminUserRow, "id" | "email"> | undefined;

  return row ? { id: Number(row.id), email: row.email } : null;
}

export function verifyAdminCredentials(email: string, password: string): AdminIdentity | null {
  const user = findAdminByEmail(email);
  if (!user || user.active !== 1) return null;

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
