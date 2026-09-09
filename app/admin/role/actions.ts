"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import {
  DEFAULT_MATRIX_ROWS,
  saveRolePermissionsMatrix,
  type MatrixRow,
} from "@/lib/role-permissions";

export type UpdateMatrixResult = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function updatePermissionsMatrix(
  _previousState: UpdateMatrixResult,
  formData: FormData,
): Promise<UpdateMatrixResult> {
  const admin = await getAdminSession();
  if (!admin || admin.role !== "super_admin") {
    return {
      status: "error",
      message: "Unauthorized: Only Super Administrators can modify the permissions matrix.",
    };
  }

  const rawJson = formData.get("matrixData") as string;
  if (!rawJson) {
    return {
      status: "error",
      message: "Invalid submission: Missing permissions matrix payload.",
    };
  }

  try {
    const rows = JSON.parse(rawJson) as MatrixRow[];
    if (!Array.isArray(rows)) {
      throw new Error("Invalid payload structure.");
    }

    await saveRolePermissionsMatrix(rows);
    revalidatePath("/admin/role");

    return {
      status: "success",
      message: "Permissions matrix updated successfully.",
    };
  } catch (error) {
    console.error("Failed to save permissions matrix", error);
    return {
      status: "error",
      message: "Failed to update permissions matrix. Please try again.",
    };
  }
}

export async function resetPermissionsMatrix(): Promise<UpdateMatrixResult> {
  const admin = await getAdminSession();
  if (!admin || admin.role !== "super_admin") {
    return {
      status: "error",
      message: "Unauthorized: Only Super Administrators can reset the permissions matrix.",
    };
  }

  try {
    await saveRolePermissionsMatrix(DEFAULT_MATRIX_ROWS);
    revalidatePath("/admin/role");

    return {
      status: "success",
      message: "Permissions matrix reset to factory defaults.",
    };
  } catch (error) {
    console.error("Failed to reset permissions matrix", error);
    return {
      status: "error",
      message: "Failed to reset permissions matrix.",
    };
  }
}
