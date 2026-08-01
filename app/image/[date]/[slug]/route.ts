import { readArticleImage } from "@/lib/image-library";

export const runtime = "nodejs";

type ImageRouteContext = {
  params: Promise<{ date: string; slug: string }>;
};

export async function GET(_request: Request, { params }: ImageRouteContext) {
  const { date, slug } = await params;
  const image = await readArticleImage(date, slug);
  if (!image) return new Response("Image not found.", { status: 404 });

  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(image.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
