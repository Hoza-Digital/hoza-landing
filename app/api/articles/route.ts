import { NextResponse } from "next/server";
import { ARTICLES_PER_PAGE, parseArticlePage } from "@/lib/article-pagination";
import { getArticleBatch } from "@/lib/public-articles";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const page = parseArticlePage(params.get("page") ?? undefined);
  const rawIndex = params.get("index") ?? "0";
  const index = /^\d{1,2}$/.test(rawIndex) ? Number(rawIndex) : -1;
  const category = (params.get("category") ?? "").trim();
  if (!page || index < 0 || index >= ARTICLES_PER_PAGE || category.length > 80) {
    return NextResponse.json({ message: "Invalid article request." }, { status: 400 });
  }
  try {
    const batch = await getArticleBatch(page, index, category);
    // Cache only in the server data cache so publishing/archiving can invalidate it.
    return NextResponse.json(batch, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "Articles could not be loaded. Please try again." }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
