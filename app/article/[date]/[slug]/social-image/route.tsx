import sharp from "sharp";
import { getPublishedArticle } from "@/lib/articles";

export const runtime = "nodejs";

type SocialImageRouteContext = {
  params: Promise<{ date: string; slug: string }>;
};

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hozadigital.com").replace(/\/+$/, "");

export async function GET(_request: Request, { params }: SocialImageRouteContext) {
  const { date, slug } = await params;
  const article = await getPublishedArticle(date, slug);

  if (!article) {
    return new Response("Article not found", { status: 404 });
  }

  const coverImageUrl = new URL(article.coverImageUrl, `${siteUrl}/`).toString();
  const coverResponse = await fetch(coverImageUrl);

  if (!coverResponse.ok) {
    return new Response("Cover image not found", { status: 404 });
  }

  const coverBytes = await coverResponse.arrayBuffer();
  const socialImage = await sharp(coverBytes)
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9, quality: 90 })
    .toBuffer();

  return new Response(new Uint8Array(socialImage), {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": socialImage.byteLength.toString(),
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
