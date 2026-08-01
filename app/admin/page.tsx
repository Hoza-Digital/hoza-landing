import Link from "next/link";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getEnquiryStats, listEnquiries } from "@/lib/enquiries";
import { logoutAdmin } from "./actions";
import { EnquiryDashboard } from "./enquiry-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthenticated())) redirect("/admlog");

  const [enquiries, stats] = await Promise.all([
    listEnquiries(),
    getEnquiryStats(),
  ]);

  return (
    <main className="admin-dashboard">
      <header className="admin-topbar">
        <Link href="/" className="admin-brand" aria-label="Hoza home">
          <Logo decorative />
          <span>CONTROL CENTRE</span>
        </Link>
        <div className="admin-system-state"><i /> DATABASE CONNECTED</div>
        <form action={logoutAdmin}>
          <button className="admin-logout" type="submit">Log out <LogOut aria-hidden="true" /></button>
        </form>
      </header>

      <section className="admin-dashboard-hero">
        <div>
          <span className="eyebrow">Enquiry intelligence</span>
          <h1>LEADS IN.<br /><em>MOVE FORWARD.</em></h1>
        </div>
        <p>Every project request, captured and ready for action. Review the brief, contact the lead and keep the conversation moving.</p>
      </section>

      <EnquiryDashboard enquiries={enquiries} stats={stats} />
    </main>
  );
}
