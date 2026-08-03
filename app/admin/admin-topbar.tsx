import Link from "next/link";
import { FilePlus2, FolderKanban, LayoutDashboard, LogOut, Menu, Users } from "lucide-react";
import { Logo } from "@/components/logo";
import {
  ADMIN_ROLE_LABELS,
  canAccessArticleProduction,
  canAccessProjectSignals,
  type AdminIdentity,
} from "@/lib/admin-users";
import { logoutAdmin } from "./actions";

export function AdminTopbar({ user }: { user: AdminIdentity }) {
  return (
    <header className="admin-topbar">
      <Link href="/" className="admin-brand" aria-label="Hoza home">
        <Logo decorative />
        <span>CONTROL CENTRE</span>
      </Link>

      <div className="admin-system-state"><i /> DATABASE CONNECTED</div>

      <details className="admin-menu">
        <summary aria-label="Open admin menu">
          <Menu aria-hidden="true" />
        </summary>
        <div className="admin-menu-panel">
          <span>{ADMIN_ROLE_LABELS[user.role]} MENU</span>
          <nav aria-label="Admin navigation">
            <Link href="/admin">
              <LayoutDashboard aria-hidden="true" />
              Dashboard
            </Link>
            {canAccessProjectSignals(user.role) && (
              <Link href="/admin/projectsignal">
                <FolderKanban aria-hidden="true" />
                Project signals
              </Link>
            )}
            {canAccessArticleProduction(user.role) && (
              <Link href="/admin/prodarticle">
                <FilePlus2 aria-hidden="true" />
                Produce article
              </Link>
            )}
            <Link href="/admin/user">
              <Users aria-hidden="true" />
              User management
            </Link>
          </nav>
          <form action={logoutAdmin}>
            <button type="submit">
              <LogOut aria-hidden="true" />
              Log out
            </button>
          </form>
        </div>
      </details>
    </header>
  );
}
