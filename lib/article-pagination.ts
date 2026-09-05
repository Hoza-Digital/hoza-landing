import type { ArticleSummary } from "./articles";

export const ARTICLES_PER_PAGE = 20;
export const ARTICLES_PER_BATCH = 3;
export const PUBLIC_ARTICLES_TAG = "public-articles";

export type ArticleBatch = {
  articles: ArticleSummary[];
  total: number;
};

export function articleListHref(page: number, category = "") {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/article${query ? `?${query}` : ""}`;
}

export function parseArticlePage(value: string | undefined) {
  if (!value) return 1;
  if (!/^[1-9]\d{0,5}$/.test(value)) return null;
  return Number(value);
}

export function articleHref(article: Pick<ArticleSummary, "publishDate" | "slug">) {
  return `/article/${article.publishDate.replaceAll("-", "").slice(2)}/${article.slug}`;
}
