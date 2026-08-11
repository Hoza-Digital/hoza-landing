import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const BUCKET_ID = "article-images";
const MAX_FILE_SIZE = 1024 * 1024;
const STORAGE_PATH_PATTERN = /^\d{6}\/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/;

function requiredEnvironment(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function storageSecret() {
  const configuredKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (configuredKeys) {
    const keys = JSON.parse(configuredKeys) as Record<string, string>;
    if (keys.default) return keys.default;
  }
  return requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(
  requiredEnvironment("SUPABASE_URL"),
  storageSecret(),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function hasValidBackendSecret(request: Request) {
  const backendSecret = request.headers.get("x-hoza-backend-secret");
  if (!backendSecret) return false;

  const { data, error } = await supabaseAdmin.rpc("hoza_edge_validate_backend_secret", {
    p_backend_secret: backendSecret,
  });
  if (error) {
    console.error("Image library authorization failed", { code: error.code });
    return false;
  }
  return data === true;
}

async function ensureBucket() {
  const { data } = await supabaseAdmin.storage.getBucket(BUCKET_ID);
  if (data) return;

  const { error } = await supabaseAdmin.storage.createBucket(BUCKET_ID, {
    public: false,
    allowedMimeTypes: ["image/webp"],
    fileSizeLimit: MAX_FILE_SIZE,
  });
  if (error && !error.message.toLowerCase().includes("already exists")) throw error;
}

async function upload(request: Request, storagePath: string) {
  if (request.headers.get("content-type")?.split(";")[0] !== "image/webp") {
    return json({ error: "Only WebP images are accepted." }, 415);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_FILE_SIZE) {
    return json({ error: "The WebP image must be smaller than 1 MB." }, 413);
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_FILE_SIZE) {
    return json({ error: "The WebP image must be smaller than 1 MB." }, 413);
  }
  if (
    bytes.byteLength < 12
    || new TextDecoder().decode(bytes.subarray(0, 4)) !== "RIFF"
    || new TextDecoder().decode(bytes.subarray(8, 12)) !== "WEBP"
  ) {
    return json({ error: "The uploaded file is not a valid WebP image." }, 415);
  }

  await ensureBucket();
  const { error } = await supabaseAdmin.storage.from(BUCKET_ID).upload(storagePath, bytes, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    console.error("Image library upload failed", { status: error.statusCode });
    return json({ error: "The image could not be stored." }, error.statusCode === "409" ? 409 : 500);
  }

  return json({ storagePath }, 201);
}

async function download(storagePath: string) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET_ID).download(storagePath);
  if (error || !data) return new Response("Image not found.", { status: 404 });

  return new Response(data, {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(data.size),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function remove(storagePath: string) {
  const { error } = await supabaseAdmin.storage.from(BUCKET_ID).remove([storagePath]);
  if (error) {
    console.error("Image library deletion failed", { status: error.statusCode });
    return json({ error: "The image could not be deleted." }, 500);
  }
  return new Response(null, { status: 204 });
}

Deno.serve(async (request) => {
  try {
    if (!await hasValidBackendSecret(request)) {
      return json({ error: "Not authorized." }, 401);
    }

    const storagePath = new URL(request.url).searchParams.get("path") ?? "";
    if (!STORAGE_PATH_PATTERN.test(storagePath)) {
      return json({ error: "Invalid image path." }, 400);
    }

    if (request.method === "PUT") return await upload(request, storagePath);
    if (request.method === "GET") return await download(storagePath);
    if (request.method === "DELETE") return await remove(storagePath);
    return json({ error: "Method not allowed." }, 405);
  } catch (error) {
    console.error("Image library request failed", error);
    return json({ error: "The image library is temporarily unavailable." }, 500);
  }
});
