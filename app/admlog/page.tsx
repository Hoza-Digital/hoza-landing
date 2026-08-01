import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin");

  return (
    <main className="admin-login-page">
      <div className="admin-login-shell">
        <section className="admin-login-visual" aria-label="Hoza admin portal">
          <Link className="admin-login-logo" href="/" aria-label="Back to Hoza home">
            <Logo decorative />
          </Link>
          <div className="admin-login-orbit" aria-hidden="true">
            <span />
            <span />
            <i />
          </div>
          <div className="admin-login-visual-copy">
            <p>HOZA / CONTROL CENTRE</p>
            <h1>MOVE WITH<br /><em>CLARITY.</em></h1>
            <span>PRIVATE SYSTEM · AUTHORISED ACCESS ONLY</span>
          </div>
        </section>

        <section className="admin-login-panel">
          <div className="admin-login-status"><i /> SYSTEM ONLINE</div>
          <div className="admin-login-copy">
            <span className="eyebrow">Admin access</span>
            <h2>WELCOME<br />BACK.</h2>
            <p>Sign in to review project enquiries and move conversations forward.</p>
          </div>
          <LoginForm />
          <Link className="admin-back-link" href="/">← Return to website</Link>
        </section>
      </div>
    </main>
  );
}
