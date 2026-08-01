import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { registerArticleImage } from "@/lib/articles";
import { getSupabaseServerConfig } from "@/lib/supabase";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 1024 * 1024;
const uploadResponseSchema = z.object({
  storagePath: z.string().min(1),
  publicUrl: z.string().url(),
  originalName: z.string().min(1),
  sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE),
  width: z.number().int().positive().max(6000),
  height: z.number().int().positive().max(6000),
});

function error(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return error("Admin login required.", 401);
  if (request.headers.get("content-type")?.split(";")[0] !== "image/webp") {
    return error("Only WebP images are accepted.", 415);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_FILE_SIZE) {
    return error("The WebP image must be smaller than 1 MB.", 413);
  }

  const width = Number(request.headers.get("x-image-width"));
  const height = Number(request.headers.get("x-image-height"));
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 6000 || height > 6000) {
    return error("Invalid image dimensions.", 400);
  }

  const body = await request.arrayBuffer();
  if (body.byteLength === 0 || body.byteLength > MAX_FILE_SIZE) {
    return error("The WebP image must be smaller than 1 MB.", 413);
  }

  const { url, publishableKey, backendSecret } = getSupabaseServerConfig();
  const storageResponse = await fetch(`${url}/functions/v1/article-image-upload`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      "Content-Type": "image/webp",
      "x-hoza-backend-secret": backendSecret,
      "x-file-name": request.headers.get("x-file-name") ?? "article-image.webp",
      "x-image-width": String(width),
      "x-image-height": String(height),
    },
    body,
    cache: "no-store",
  });

  const rawResult: unknown = await storageResponse.json().catch(() => null);
  if (!storageResponse.ok) {
    const message = rawResult && typeof rawResult === "object" && "error" in rawResult && typeof rawResult.error === "string"
      ? rawResult.error
      : "The image could not be uploaded.";
    return error(message, storageResponse.status);
  }

  const parsed = uploadResponseSchema.safeParse(rawResult);
  if (!parsed.success) return error("The image service returned an invalid response.", 502);

  const id = await registerArticleImage(parsed.data);
  return Response.json(
    { id: Number(id), ...parsed.data, createdAt: new Date().toISOString() },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
