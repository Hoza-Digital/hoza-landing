import { promises as fs } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";

export type MatrixRow = {
  id: string;
  feature: string;
  description: string;
  superAdmin: boolean; // Always true for superAdmin
  admin: boolean;
  marketing: boolean;
  writer: boolean;
};

export const DEFAULT_MATRIX_ROWS: MatrixRow[] = [
  {
    id: "dashboard",
    feature: "Control Centre Dashboard (/admin)",
    description: "Access system overview and overall statistics",
    superAdmin: true,
    admin: true,
    marketing: true,
    writer: true,
  },
  {
    id: "project_signals",
    feature: "Project Signals (/admin/projectsignal)",
    description: "View and manage incoming project enquiry signals",
    superAdmin: true,
    admin: true,
    marketing: true,
    writer: false,
  },
  {
    id: "produce_article",
    feature: "Produce Article (/admin/prodarticle)",
    description: "Create, edit, schedule, and archive website articles",
    superAdmin: true,
    admin: true,
    marketing: false,
    writer: true,
  },
  {
    id: "user_management",
    feature: "User Management (/admin/user)",
    description: "View active user directory and profiles",
    superAdmin: true,
    admin: true,
    marketing: true,
    writer: true,
  },
  {
    id: "provision_users",
    feature: "Provision New Users",
    description: "Add new accounts for team members",
    superAdmin: true,
    admin: true,
    marketing: false,
    writer: false,
  },
  {
    id: "manage_roles",
    feature: "Manage Roles & Delete Users",
    description: "Update user permissions or remove access",
    superAdmin: true,
    admin: true,
    marketing: false,
    writer: false,
  },
  {
    id: "super_admin_privileges",
    feature: "Super Admin Privileges",
    description: "Manage Super Admin users and root system settings",
    superAdmin: true,
    admin: false,
    marketing: false,
    writer: false,
  },
];

const MATRIX_COOKIE_NAME = "hoza_role_matrix_config";
const CONFIG_FILE_PATH = path.join(process.cwd(), "data", "role-matrix.json");

function mergeWithDefaults(rows: Partial<MatrixRow>[]): MatrixRow[] {
  return DEFAULT_MATRIX_ROWS.map((defRow) => {
    const found = rows.find((row) => row.id === defRow.id || row.feature === defRow.feature);
    if (!found) return defRow;
    return {
      ...defRow,
      admin: Boolean(found.admin),
      marketing: Boolean(found.marketing),
      writer: Boolean(found.writer),
      superAdmin: true, // Super Admin is always true
    };
  });
}

export async function getRolePermissionsMatrix(): Promise<MatrixRow[]> {
  // 1. Try to read from HTTP-only session cookie
  try {
    const cookieStore = await cookies();
    const cookieVal = cookieStore.get(MATRIX_COOKIE_NAME)?.value;
    if (cookieVal) {
      const parsed = JSON.parse(Buffer.from(cookieVal, "base64url").toString("utf8")) as Partial<MatrixRow>[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return mergeWithDefaults(parsed);
      }
    }
  } catch {
    // Fallback if cookie access fails
  }

  // 2. Fallback to local config file if present
  try {
    const raw = await fs.readFile(CONFIG_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<MatrixRow>[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return mergeWithDefaults(parsed);
    }
  } catch {
    // Fallback if file does not exist
  }

  return DEFAULT_MATRIX_ROWS;
}

export async function saveRolePermissionsMatrix(rows: MatrixRow[]): Promise<void> {
  const sanitizedRows = mergeWithDefaults(rows);

  // 1. Persist matrix state in HTTP-only Cookie
  try {
    const cookieStore = await cookies();
    const payload = JSON.stringify(
      sanitizedRows.map((r) => ({
        id: r.id,
        admin: r.admin,
        marketing: r.marketing,
        writer: r.writer,
      })),
    );
    const encoded = Buffer.from(payload).toString("base64url");
    cookieStore.set(MATRIX_COOKIE_NAME, encoded, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  } catch (err) {
    console.warn("Failed to set role matrix cookie:", err);
  }

  // 2. Attempt local file save (ignores read-only filesystem errors on Vercel/serverless)
  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(sanitizedRows, null, 2), "utf8");
  } catch {
    // Intentionally suppressed on read-only server environments
  }
}
