import type { MetadataRoute } from "next";
import { articlePath, listPublishedArticles } from "@/lib/articles";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hozadigital.com";
  const articles = await listPublishedArticles().catch(() => []);

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/article`, lastModified: new Date(), changeFrequency: "weekly", priority: .8 },
    ...articles.map((article) => ({
      url: `${baseUrl}${articlePath(article)}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly" as const,
      priority: .7,
    })),
  ];
}
