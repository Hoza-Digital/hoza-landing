import Link from "next/link";
import { FolderKanban, LayoutDashboard, LogOut, Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { logoutAdmin } from "./actions";

export function AdminTopbar() {
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
          <span>ADMIN MENU</span>
          <nav aria-label="Admin navigation">
            <Link href="/admin">
              <LayoutDashboard aria-hidden="true" />
              Dashboard
            </Link>
            <Link href="/projectsignal">
              <FolderKanban aria-hidden="true" />
              Project signals
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
