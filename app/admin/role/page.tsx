import { redirect } from "next/navigation";
import {
  Check,
  Crown,
  FilePlus2,
  FolderKanban,
  ShieldCheck,
  X,
} from "lucide-react";
import { AdminTopbar } from "@/app/admin/admin-topbar";
import { getAdminSession } from "@/lib/admin-auth";
import { ADMIN_ROLE_LABELS, type AdminRole } from "@/lib/admin-users";
import "./role.css";

export const dynamic = "force-dynamic";

type RoleCardInfo = {
  role: AdminRole;
  title: string;
  scopeSummary: string;
  description: string;
  icon: typeof ShieldCheck;
};

const ROLE_CARDS: RoleCardInfo[] = [
  {
    role: "super_admin",
    title: ADMIN_ROLE_LABELS.super_admin,
    scopeSummary: "Akses penuh (Full system & user control)",
    description:
      "Super Administrators hold complete, unrestricted control over system configuration, user accounts, role modifications, project signals, and article production.",
    icon: Crown,
  },
  {
    role: "admin",
    title: ADMIN_ROLE_LABELS.admin,
    scopeSummary: "Dapat mengelola user marketing/writer & project signal",
    description:
      "Administrators manage team user accounts (Marketing & Writer roles), inspect incoming project signals, and oversee article publishing workflows.",
    icon: ShieldCheck,
  },
  {
    role: "marketing",
    title: ADMIN_ROLE_LABELS.marketing,
    scopeSummary: "Akses ke project signal & enquiry",
    description:
      "Marketing specialists focus on client lead discovery, reviewing incoming project signals, and monitoring customer enquiry responses.",
    icon: FolderKanban,
  },
  {
    role: "writer",
    title: ADMIN_ROLE_LABELS.writer,
    scopeSummary: "Akses ke produksi artikel",
    description:
      "Content Writers focus exclusively on creating, editing, scheduling, and publishing articles within the Content Library.",
    icon: FilePlus2,
  },
];

type MatrixRow = {
  feature: string;
  description: string;
  superAdmin: boolean;
  admin: boolean;
  marketing: boolean;
  writer: boolean;
};

const MATRIX_ROWS: MatrixRow[] = [
  {
    feature: "Control Centre Dashboard (/admin)",
    description: "Access system overview and overall statistics",
    superAdmin: true,
    admin: true,
    marketing: true,
    writer: true,
  },
  {
    feature: "Project Signals (/admin/projectsignal)",
    description: "View and manage incoming project enquiry signals",
    superAdmin: true,
    admin: true,
    marketing: true,
    writer: false,
  },
  {
    feature: "Produce Article (/admin/prodarticle)",
    description: "Create, edit, schedule, and archive website articles",
    superAdmin: true,
    admin: true,
    marketing: false,
    writer: true,
  },
  {
    feature: "User Management (/admin/user)",
    description: "View active user directory and profiles",
    superAdmin: true,
    admin: true,
    marketing: true,
    writer: true,
  },
  {
    feature: "Provision New Users",
    description: "Add new accounts for team members",
    superAdmin: true,
    admin: true, // Only marketing & writer
    marketing: false,
    writer: false,
  },
  {
    feature: "Manage Roles & Delete Users",
    description: "Update user permissions or remove access",
    superAdmin: true,
    admin: true, // Limited to marketing & writer
    marketing: false,
    writer: false,
  },
  {
    feature: "Super Admin Privileges",
    description: "Manage Super Admin users and root system settings",
    superAdmin: true,
    admin: false,
    marketing: false,
    writer: false,
  },
];

export default async function RoleManagementPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admlog");

  return (
    <main className="admin-dashboard role-management-page">
      <AdminTopbar user={admin} />

      <section className="role-management-hero">
        <div>
          <span className="eyebrow">Access governance</span>
          <h1>
            ROLES &amp;<br />
            <em>PERMISSIONS.</em>
          </h1>
        </div>
        <div className="role-viewer-card">
          <span>YOUR ACTIVE ROLE</span>
          <strong>{admin.name}</strong>
          <div className={`role-badge ${admin.role}`}>
            <ShieldCheck aria-hidden="true" style={{ width: ".8rem" }} />
            {ADMIN_ROLE_LABELS[admin.role]}
          </div>
        </div>
      </section>

      <section className="role-cards-section">
        <header>
          <p>System hierarchy</p>
          <h2>ROLE OVERVIEW.</h2>
        </header>

        <div className="role-cards-grid">
          {ROLE_CARDS.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.role} className="role-card">
                <div className="role-card-header">
                  <div className="role-card-icon">
                    <Icon aria-hidden="true" />
                  </div>
                  <span className={`role-badge ${item.role}`}>
                    {item.role}
                  </span>
                </div>
                <h3 className="role-card-title">{item.title}</h3>
                <p className="role-card-desc">{item.description}</p>
                <div className="role-card-access">
                  <span>Hak Akses Utama</span>
                  <p>{item.scopeSummary}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="role-matrix-section">
        <header>
          <p>Detailed matrix</p>
          <h2>PERMISSIONS MATRIX.</h2>
        </header>

        <div className="role-matrix-table-wrap">
          <table className="role-matrix-table">
            <thead>
              <tr>
                <th>Feature / Capability</th>
                <th>Super Admin</th>
                <th>Admin</th>
                <th>Marketing</th>
                <th>Content Writer</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td>
                    <div className="role-matrix-feature">
                      <strong>{row.feature}</strong>
                      <span>{row.description}</span>
                    </div>
                  </td>
                  <td>
                    {row.superAdmin ? (
                      <span className="role-check"><Check aria-hidden="true" /> Full</span>
                    ) : (
                      <span className="role-cross"><X aria-hidden="true" /> None</span>
                    )}
                  </td>
                  <td>
                    {row.admin ? (
                      <span className="role-check"><Check aria-hidden="true" /> Allowed</span>
                    ) : (
                      <span className="role-cross"><X aria-hidden="true" /> None</span>
                    )}
                  </td>
                  <td>
                    {row.marketing ? (
                      <span className="role-check"><Check aria-hidden="true" /> Allowed</span>
                    ) : (
                      <span className="role-cross"><X aria-hidden="true" /> None</span>
                    )}
                  </td>
                  <td>
                    {row.writer ? (
                      <span className="role-check"><Check aria-hidden="true" /> Allowed</span>
                    ) : (
                      <span className="role-cross"><X aria-hidden="true" /> None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
