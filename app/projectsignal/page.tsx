import { notFound, redirect } from "next/navigation";
import { AdminTopbar } from "@/app/admin/admin-topbar";
import { ProjectSignals } from "@/app/admin/enquiry-dashboard";
import { getAdminSession } from "@/lib/admin-auth";
import { canAccessProjectSignals } from "@/lib/admin-users";
import { listEnquiries } from "@/lib/enquiries";

export const dynamic = "force-dynamic";

export default async function ProjectSignalPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admlog");
  if (!canAccessProjectSignals(admin.role)) notFound();

  const enquiries = await listEnquiries();

  return (
    <main className="admin-dashboard admin-project-page">
      <AdminTopbar user={admin} />
      <ProjectSignals enquiries={enquiries} />
    </main>
  );
}
