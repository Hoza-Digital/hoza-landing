import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.111.0";

const BUCKET = "article-images";
const MAX_FILE_SIZE = 1024 * 1024;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function getSecretKey() {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}") as Record<string, string>;
    if (keys.default) return keys.default;
  } catch {
    // The legacy key below keeps existing Supabase projects compatible.
  }

  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (request.headers.get("content-type")?.split(";")[0] !== "image/webp") {
    return json({ error: "Only WebP images are accepted." }, 415);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKey = getSecretKey();
  const backendSecret = request.headers.get("x-hoza-backend-secret");
  if (!supabaseUrl || !secretKey || !backendSecret) {
    return json({ error: "Image storage is not configured." }, 503);
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: validSecret, error: secretError } = await supabase.rpc(
    "hoza_admin_validate_backend_secret",
    { p_backend_secret: backendSecret },
  );
  if (secretError || validSecret !== true) return json({ error: "Unauthorized." }, 401);

  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength === 0 || body.byteLength > MAX_FILE_SIZE) {
    return json({ error: "The WebP image must be smaller than 1 MB." }, 413);
  }

  const width = Number(request.headers.get("x-image-width"));
  const height = Number(request.headers.get("x-image-height"));
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 6000 || height > 6000) {
    return json({ error: "Invalid image dimensions." }, 400);
  }

  const { data: existingBucket } = await supabase.storage.getBucket(BUCKET);
  if (!existingBucket) {
    const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ["image/webp"],
    });
    if (bucketError && !bucketError.message.toLowerCase().includes("already exists")) {
      return json({ error: "Could not prepare article storage." }, 500);
    }
  }

  const now = new Date();
  const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) return json({ error: "The image could not be uploaded." }, 500);

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  let originalName = "article-image.webp";
  try {
    originalName = decodeURIComponent(request.headers.get("x-file-name") ?? originalName);
  } catch {
    // Keep the safe fallback name.
  }

  return json({
    storagePath: path,
    publicUrl: publicData.publicUrl,
    originalName: originalName.slice(0, 180),
    sizeBytes: body.byteLength,
    width,
    height,
  }, 201);
});
