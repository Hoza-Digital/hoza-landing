import { redirect } from "next/navigation";
import { AdminTopbar } from "@/app/admin/admin-topbar";
import { ProjectSignals } from "@/app/admin/enquiry-dashboard";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listEnquiries } from "@/lib/enquiries";

export const dynamic = "force-dynamic";

export default async function ProjectSignalPage() {
  if (!(await isAdminAuthenticated())) redirect("/admlog");

  const enquiries = await listEnquiries();

  return (
    <main className="admin-dashboard admin-project-page">
      <AdminTopbar />
      <ProjectSignals enquiries={enquiries} />
    </main>
  );
}
