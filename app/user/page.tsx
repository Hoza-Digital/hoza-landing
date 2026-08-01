import { redirect } from "next/navigation";
import { AdminTopbar } from "@/app/admin/admin-topbar";
import { getAdminSession } from "@/lib/admin-auth";
import {
  ADMIN_ROLES,
  ADMIN_ROLE_LABELS,
  canChangeManagedRole,
  canDeleteManagedUser,
  creatableRoles,
  listManagedAdminUsers,
  type AdminRole,
} from "@/lib/admin-users";
import { UserManagement, type UserManagementRecord } from "./user-management";

export const dynamic = "force-dynamic";

function maskEmail(email: string) {
  return `${email.slice(0, 3)}************`;
}

function roleOptions(actorRole: AdminRole, targetRole: AdminRole): AdminRole[] {
  if (!canChangeManagedRole(actorRole, targetRole)) return [];
  if (actorRole === "super_admin") return [...ADMIN_ROLES];
  return ["marketing", "writer"];
}

export default async function UserManagementPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admlog");

  const users = await listManagedAdminUsers(admin);
  const canSeeFullEmail = admin.role === "super_admin" || admin.role === "admin";
  const records: UserManagementRecord[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: canSeeFullEmail ? user.email : maskEmail(user.email),
    role: user.role,
    createdAt: user.createdAt,
    canChangeRole: canChangeManagedRole(admin.role, user.role),
    canDelete: canDeleteManagedUser(admin.role, user.role),
    roleOptions: roleOptions(admin.role, user.role),
  }));

  return (
    <main className="admin-dashboard user-management-page">
      <AdminTopbar user={admin} />

      <section className="user-management-hero">
        <div>
          <span className="eyebrow">Access governance</span>
          <h1>PEOPLE IN.<br /><em>ROLES CLEAR.</em></h1>
        </div>
        <div className="user-viewer-card">
          <span>CURRENT ACCESS</span>
          <strong>{admin.name}</strong>
          <p>{ADMIN_ROLE_LABELS[admin.role]}</p>
        </div>
      </section>

      <UserManagement users={records} creatableRoleOptions={creatableRoles(admin.role)} />
    </main>
  );
}
