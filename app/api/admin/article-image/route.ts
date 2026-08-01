import { isAdminAuthenticated } from "@/lib/admin-auth";
import { registerArticleImage } from "@/lib/articles";
import { deleteArticleImage, saveArticleImage } from "@/lib/image-library";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 1024 * 1024;
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

  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength === 0 || body.byteLength > MAX_FILE_SIZE) {
    return error("The WebP image must be smaller than 1 MB.", 413);
  }
  if (
    body.byteLength < 12
    || new TextDecoder().decode(body.subarray(0, 4)) !== "RIFF"
    || new TextDecoder().decode(body.subarray(8, 12)) !== "WEBP"
  ) {
    return error("The uploaded file is not a valid WebP image.", 415);
  }

  let originalName = "article-image.webp";
  let altText = "";
  try {
    originalName = decodeURIComponent(request.headers.get("x-file-name") ?? originalName)
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .slice(0, 180) || originalName;
    altText = decodeURIComponent(request.headers.get("x-image-alt") ?? "").trim();
  } catch {
    return error("Invalid image metadata.", 400);
  }
  if (altText.length < 3 || altText.length > 180) {
    return error("Image alt text must be between 3 and 180 characters.", 400);
  }

  const saved = await saveArticleImage(body, originalName);
  const image = {
    ...saved,
    originalName,
    altText,
    sizeBytes: body.byteLength,
    width,
    height,
  };

  try {
    const id = await registerArticleImage(image);
    return Response.json(
      { id: Number(id), ...image, createdAt: new Date().toISOString() },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (uploadError) {
    await deleteArticleImage(saved.storagePath);
    throw uploadError;
  }
}
