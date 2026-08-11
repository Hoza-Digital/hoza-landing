import "server-only";

import { randomUUID } from "node:crypto";
import { getSupabaseServerConfig } from "./supabase";

const DATE_CODE_PATTERN = /^\d{6}$/;
const IMAGE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STORAGE_PATH_PATTERN = /^(\d{6})\/([a-z0-9]+(?:-[a-z0-9]+)*)\.webp$/;

function jakartaDateCode() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year.slice(2)}${values.month}${values.day}`;
}

function imageSlug(originalName: string) {
  const base = originalName.replace(/\.webp$/i, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "") || "article-image";
  return `${base}-${randomUUID().slice(0, 8)}`;
}

export type SavedArticleImage = {
  storagePath: string;
  publicUrl: string;
};

async function callImageLibrary(storagePath: string, method: "GET" | "PUT" | "DELETE", bytes?: Uint8Array) {
  const { url, publishableKey, backendSecret } = getSupabaseServerConfig();
  return await fetch(
    `${url}/functions/v1/hoza-image-library?path=${encodeURIComponent(storagePath)}`,
    {
      method,
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        "x-hoza-backend-secret": backendSecret,
        ...(bytes ? { "Content-Type": "image/webp" } : {}),
      },
      body: bytes ? Buffer.from(bytes) : undefined,
      cache: "no-store",
    },
  );
}

export async function saveArticleImage(bytes: Uint8Array, originalName: string): Promise<SavedArticleImage> {
  const dateCode = jakartaDateCode();
  const slug = imageSlug(originalName);
  const storagePath = `${dateCode}/${slug}.webp`;
  const response = await callImageLibrary(storagePath, "PUT", bytes);
  if (!response.ok) {
    console.error("Supabase image upload failed", { status: response.status });
    throw new Error("The image could not be stored in the server library.");
  }

  return {
    storagePath,
    publicUrl: `/image/${dateCode}/${slug}`,
  };
}

export async function readArticleImage(dateCode: string, slug: string) {
  if (!DATE_CODE_PATTERN.test(dateCode) || !IMAGE_SLUG_PATTERN.test(slug)) return null;
  const response = await callImageLibrary(`${dateCode}/${slug}.webp`, "GET");
  if (response.status === 404) return null;
  if (!response.ok) {
    console.error("Supabase image download failed", { status: response.status });
    throw new Error("The image could not be loaded from the server library.");
  }
  return new Uint8Array(await response.arrayBuffer());
}

export async function deleteArticleImage(storagePath: string) {
  if (!STORAGE_PATH_PATTERN.test(storagePath)) return;
  const response = await callImageLibrary(storagePath, "DELETE");
  if (!response.ok) {
    console.error("Supabase image deletion failed", { status: response.status });
    throw new Error("The image could not be deleted from the server library.");
  }
}
