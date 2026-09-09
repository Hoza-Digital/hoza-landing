import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { ARTICLES_PER_BATCH, ARTICLES_PER_PAGE, PUBLIC_ARTICLES_TAG, type ArticleBatch } from "./article-pagination";
import { mapSummary, normalizeCategoryName, type ArticleSummaryRow } from "./articles";
import { callSupabaseRpc, callSupabaseRpcResult, getSupabaseServerConfig } from "./supabase";

const publicCache = { revalidate: 60, tags: [PUBLIC_ARTICLES_TAG] };

export const listArticleCategories = cache(async (): Promise<string[]> => {
  // Request category names only, not every article's title, excerpt and image.
  const rows = await callSupabaseRpc<Array<{ category: string }>>("hoza_list_published_articles", {}, {
    ...publicCache,
    query: { select: "category", order: "category.asc" },
  });
  const allCategories = rows.flatMap((row) =>
    normalizeCategoryName(row.category ?? "").split(",").map((cat) => cat.trim()).filter(Boolean)
  );
  return [...new Set(allCategories)].sort((a, b) => a.localeCompare(b));
});

const cachedArticleBatch = unstable_cache(async (source: string, page: number, index: number, category: string): Promise<ArticleBatch> => {
  // Include the backend URL in the cache key to isolate environments.
  void source;
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isInteger(index) || index < 0 || index >= ARTICLES_PER_PAGE) {
    throw new Error("Invalid article position.");
  }
  const { data, count } = await callSupabaseRpcResult<ArticleSummaryRow[]>("hoza_list_published_articles", {}, {
    count: true,
    query: {
      limit: String(Math.min(ARTICLES_PER_BATCH, ARTICLES_PER_PAGE - index)),
      offset: String((page - 1) * ARTICLES_PER_PAGE + index),
      order: "published_at.desc,id.desc",
      ...(category ? { category: `ilike.%${category}%` } : {}),
    },
  });
  if (count === null) throw new Error("Article count is unavailable.");
  return { articles: data.map(mapSummary), total: count };
}, ["article-batch-v3"], publicCache);

export const getArticleBatch = cache((page: number, index = 0, category = "") =>
  cachedArticleBatch(getSupabaseServerConfig().url, page, index, category));
