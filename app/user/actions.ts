"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import {
  ADMIN_ROLES,
  canChangeManagedRole,
  canDeleteManagedUser,
  createManagedAdminUser,
  creatableRoles,
  deleteManagedAdminUser,
  hashAdminPassword,
  listManagedAdminUsers,
  updateManagedAdminRole,
} from "@/lib/admin-users";

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[A-Za-z]/)
    .regex(/[^A-Za-z0-9\s]/),
  role: z.enum(ADMIN_ROLES),
});

const targetSchema = z.object({
  targetId: z.coerce.number().int().positive(),
});

const roleUpdateSchema = targetSchema.extend({ role: z.enum(ADMIN_ROLES) });

export type CreateUserState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function createUser(
  _previousState: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const admin = await getAdminSession();
  if (!admin) redirect("/admlog");

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success || !creatableRoles(admin.role).includes(parsed.data.role)) {
    return {
      status: "error",
      message: "Check the name, email, role and password. Passwords require at least 8 characters, one uppercase letter, one lowercase letter and one special character.",
    };
  }

  try {
    await createManagedAdminUser({
      actorId: admin.id,
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: hashAdminPassword(parsed.data.password),
    });
  } catch (error) {
    console.error("User creation failed", error);
    return {
      status: "error",
      message: "The user could not be created. This email may already be registered.",
    };
  }

  revalidatePath("/user");
  return {
    status: "success",
    message: "User created. The password was securely stored and remains case-sensitive.",
  };
}

export async function changeUserRole(formData: FormData) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admlog");

  const parsed = roleUpdateSchema.safeParse({
    targetId: formData.get("targetId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return;

  const users = await listManagedAdminUsers(admin);
  const target = users.find((user) => user.id === parsed.data.targetId);
  if (!target || !canChangeManagedRole(admin.role, target.role)) return;

  await updateManagedAdminRole(admin.id, target.id, parsed.data.role);
  revalidatePath("/user");
}

export async function deleteUser(formData: FormData) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admlog");

  const parsed = targetSchema.safeParse({ targetId: formData.get("targetId") });
  if (!parsed.success) return;

  const users = await listManagedAdminUsers(admin);
  const target = users.find((user) => user.id === parsed.data.targetId);
  if (!target || !canDeleteManagedUser(admin.role, target.role)) return;

  await deleteManagedAdminUser(admin.id, target.id);
  revalidatePath("/user");
}
