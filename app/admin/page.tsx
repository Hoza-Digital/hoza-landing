import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getEnquiryStats } from "@/lib/enquiries";
import { AdminTopbar } from "./admin-topbar";
import { AdminStats } from "./enquiry-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admlog");

  const stats = await getEnquiryStats();

  return (
    <main className="admin-dashboard">
      <AdminTopbar user={admin} />

      <section className="admin-dashboard-hero">
        <div>
          <span className="eyebrow">Enquiry intelligence</span>
          <h1>LEADS IN.<br /><em>MOVE FORWARD.</em></h1>
        </div>
        <p>Every project request, captured and ready for action. Review the brief, contact the lead and keep the conversation moving.</p>
      </section>

      <AdminStats stats={stats} />
    </main>
  );
}
