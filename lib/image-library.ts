import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const DATE_CODE_PATTERN = /^\d{6}$/;
const IMAGE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STORAGE_PATH_PATTERN = /^(\d{6})\/([a-z0-9]+(?:-[a-z0-9]+)*)\.webp$/;

function libraryRoot() {
  const configuredRoot = process.env.ARTICLE_IMAGE_LIBRARY_DIR?.trim();
  if (configuredRoot) return path.resolve(/* turbopackIgnore: true */ configuredRoot);
  return path.join(process.cwd(), "data", "images");
}

function safeLibraryPath(...segments: string[]) {
  const root = libraryRoot();
  const resolved = path.resolve(root, ...segments);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid image library path.");
  }
  return resolved;
}

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

export async function saveArticleImage(bytes: Uint8Array, originalName: string): Promise<SavedArticleImage> {
  const dateCode = jakartaDateCode();
  const slug = imageSlug(originalName);
  const directory = safeLibraryPath(dateCode);
  const filePath = safeLibraryPath(dateCode, `${slug}.webp`);

  await mkdir(directory, { recursive: true });
  await writeFile(filePath, bytes, { flag: "wx" });

  return {
    storagePath: `${dateCode}/${slug}.webp`,
    publicUrl: `/image/${dateCode}/${slug}`,
  };
}

export async function readArticleImage(dateCode: string, slug: string) {
  if (!DATE_CODE_PATTERN.test(dateCode) || !IMAGE_SLUG_PATTERN.test(slug)) return null;
  try {
    return await readFile(safeLibraryPath(dateCode, `${slug}.webp`));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}

export async function deleteArticleImage(storagePath: string) {
  const match = STORAGE_PATH_PATTERN.exec(storagePath);
  if (!match) return;
  try {
    await unlink(safeLibraryPath(match[1], `${match[2]}.webp`));
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
  }
}
