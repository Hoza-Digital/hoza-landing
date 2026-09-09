import { redirect } from "next/navigation";
import {
  Crown,
  FilePlus2,
  FolderKanban,
  ShieldCheck,
} from "lucide-react";
import { AdminTopbar } from "@/app/admin/admin-topbar";
import { getAdminSession } from "@/lib/admin-auth";
import { ADMIN_ROLE_LABELS, type AdminRole } from "@/lib/admin-users";
import { getRolePermissionsMatrix } from "@/lib/role-permissions";
import { PermissionsMatrix } from "./permissions-matrix";
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
    scopeSummary: "Full access (Full system & user control)",
    description:
      "Super Administrators hold complete, unrestricted control over system configuration, user accounts, role modifications, project signals, and article production.",
    icon: Crown,
  },
  {
    role: "admin",
    title: ADMIN_ROLE_LABELS.admin,
    scopeSummary: "Can manage marketing & writer users and project signals",
    description:
      "Administrators manage team user accounts (Marketing & Writer roles), inspect incoming project signals, and oversee article publishing workflows.",
    icon: ShieldCheck,
  },
  {
    role: "marketing",
    title: ADMIN_ROLE_LABELS.marketing,
    scopeSummary: "Access to project signals and enquiries",
    description:
      "Marketing specialists focus on client lead discovery, reviewing incoming project signals, and monitoring customer enquiry responses.",
    icon: FolderKanban,
  },
  {
    role: "writer",
    title: ADMIN_ROLE_LABELS.writer,
    scopeSummary: "Access to article production",
    description:
      "Content Writers focus exclusively on creating, editing, scheduling, and publishing articles within the Content Library.",
    icon: FilePlus2,
  },
];

export default async function RoleManagementPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admlog");

  const matrixRows = await getRolePermissionsMatrix();
  const isSuperAdmin = admin.role === "super_admin";

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
                  <span>Primary Scope</span>
                  <p>{item.scopeSummary}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <PermissionsMatrix isSuperAdmin={isSuperAdmin} initialRows={matrixRows} />
    </main>
  );
}
