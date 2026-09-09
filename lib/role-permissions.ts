import { promises as fs } from "node:fs";
import path from "node:path";

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

const CONFIG_FILE_PATH = path.join(process.cwd(), "data", "role-matrix.json");

export async function getRolePermissionsMatrix(): Promise<MatrixRow[]> {
  try {
    const raw = await fs.readFile(CONFIG_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as MatrixRow[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge with default rows to ensure all schema fields are intact
      return DEFAULT_MATRIX_ROWS.map((defRow) => {
        const found = parsed.find((row) => row.id === defRow.id || row.feature === defRow.feature);
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
  } catch {
    // If file doesn't exist or error occurs, return defaults
  }
  return DEFAULT_MATRIX_ROWS;
}

export async function saveRolePermissionsMatrix(rows: MatrixRow[]): Promise<void> {
  const sanitizedRows = rows.map((row) => ({
    id: row.id,
    feature: row.feature,
    description: row.description,
    superAdmin: true, // Permanent super_admin privileges
    admin: Boolean(row.admin),
    marketing: Boolean(row.marketing),
    writer: Boolean(row.writer),
  }));

  const dir = path.dirname(CONFIG_FILE_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(sanitizedRows, null, 2), "utf8");
}
