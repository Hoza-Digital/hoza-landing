"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { endAdminSession, getAdminSession } from "@/lib/admin-auth";
import { canAccessProjectSignals } from "@/lib/admin-users";
import { ENQUIRY_STATUSES, updateEnquiryStatus } from "@/lib/enquiries";

const updateSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(ENQUIRY_STATUSES),
});

export async function logoutAdmin() {
  await endAdminSession();
  redirect("/admlog");
}

export async function changeEnquiryStatus(formData: FormData) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admlog");
  if (!canAccessProjectSignals(admin.role)) notFound();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  await updateEnquiryStatus(parsed.data.id, parsed.data.status);
  revalidatePath("/admin");
  revalidatePath("/admin/projectsignal");
}
