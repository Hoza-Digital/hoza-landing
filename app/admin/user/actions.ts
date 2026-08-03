"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { deleteArticleImage, saveArticleImage } from "@/lib/image-library";
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
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9\s]/),
  role: z.enum(ADMIN_ROLES),
  avatarData: z.string().max(300_000),
  avatarFileName: z.string().max(180),
});

const AVATAR_DATA_PREFIX = "data:image/webp;base64,";
const MAX_AVATAR_BYTES = 200 * 1024;

function decodeAvatar(dataUrl: string) {
  if (!dataUrl) return null;
  if (!dataUrl.startsWith(AVATAR_DATA_PREFIX)) throw new Error("Invalid avatar format.");

  const encoded = dataUrl.slice(AVATAR_DATA_PREFIX.length);
  if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new Error("Invalid avatar data.");
  }

  const bytes = new Uint8Array(Buffer.from(encoded, "base64"));
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_AVATAR_BYTES) {
    throw new Error("The profile photo must be smaller than 200 KB.");
  }

  const decoder = new TextDecoder();
  if (
    bytes.byteLength < 12
    || decoder.decode(bytes.subarray(0, 4)) !== "RIFF"
    || decoder.decode(bytes.subarray(8, 12)) !== "WEBP"
  ) {
    throw new Error("The profile photo is not a valid WebP image.");
  }

  return bytes;
}

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
    avatarData: formData.get("avatarData") ?? "",
    avatarFileName: formData.get("avatarFileName") ?? "",
  });
  if (!parsed.success || !creatableRoles(admin.role).includes(parsed.data.role)) {
    return {
      status: "error",
      message: "Check the name, email, role and password. Passwords require at least 8 characters, one uppercase letter, one lowercase letter, one numeric character and one special character.",
    };
  }

  let avatarBytes: Uint8Array | null;
  try {
    avatarBytes = decodeAvatar(parsed.data.avatarData);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "The profile photo is invalid.",
    };
  }

  let savedAvatar: Awaited<ReturnType<typeof saveArticleImage>> | null = null;
  try {
    if (avatarBytes) {
      savedAvatar = await saveArticleImage(
        avatarBytes,
        parsed.data.avatarFileName || `${parsed.data.name}-profile.webp`,
      );
    }

    await createManagedAdminUser({
      actorId: admin.id,
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: hashAdminPassword(parsed.data.password),
      avatarPath: savedAvatar?.storagePath ?? null,
    });
  } catch (error) {
    if (savedAvatar) {
      try {
        await deleteArticleImage(savedAvatar.storagePath);
      } catch (cleanupError) {
        console.error("Unused profile photo cleanup failed", cleanupError);
      }
    }
    console.error("User creation failed", error);
    return {
      status: "error",
      message: "The user could not be created. This email may already be registered.",
    };
  }

  revalidatePath("/admin/user");
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
  revalidatePath("/admin/user");
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
  if (target.avatarPath) {
    try {
      await deleteArticleImage(target.avatarPath);
    } catch (error) {
      console.error("Deleted user profile photo cleanup failed", error);
    }
  }
  revalidatePath("/admin/user");
}
