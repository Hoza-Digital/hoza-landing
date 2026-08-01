"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";
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
  if (!(await isAdminAuthenticated())) redirect("/admlog");

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  await updateEnquiryStatus(parsed.data.id, parsed.data.status);
  revalidatePath("/admin");
  revalidatePath("/projectsignal");
}
