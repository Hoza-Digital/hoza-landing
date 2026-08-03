import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminTopbar } from "@/app/admin/admin-topbar";
import { ProjectSignals } from "@/app/admin/enquiry-dashboard";
import { getAdminSession } from "@/lib/admin-auth";
import { canAccessProjectSignals } from "@/lib/admin-users";
import { getEnquiryStats, listEnquiries } from "@/lib/enquiries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Project Signals — Hoza",
  description: "Private Hoza project enquiry records.",
  robots: { index: false, follow: false },
};

export default async function ProjectSignalPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admlog");
  if (!canAccessProjectSignals(admin.role)) notFound();

  const [enquiries, stats] = await Promise.all([
    listEnquiries(),
    getEnquiryStats(),
  ]);

  return (
    <main className="admin-dashboard admin-project-page">
      <AdminTopbar user={admin} />
      <ProjectSignals enquiries={enquiries} stats={stats} />
    </main>
  );
}
