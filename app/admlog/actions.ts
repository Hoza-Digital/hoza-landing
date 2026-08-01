"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { authenticateAdmin, startAdminSession } from "@/lib/admin-auth";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type LoginState = {
  error: string;
};

export async function loginAdmin(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email address and password." };
  }

  try {
    const admin = await authenticateAdmin(parsed.data.email, parsed.data.password);
    if (!admin) {
      return { error: "The credentials do not match our records." };
    }

    await startAdminSession(admin);
  } catch (error) {
    console.error("Admin login configuration error", error);
    return { error: "Admin access is not configured correctly." };
  }

  redirect("/admin");
}
