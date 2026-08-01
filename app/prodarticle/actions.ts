"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { ARTICLE_STATUSES, createArticle, slugifyArticleTitle } from "@/lib/articles";

const articleSchema = z.object({
  title: z.string().trim().min(3).max(180),
  category: z.string().trim().min(2).max(80),
  excerpt: z.string().trim().min(20).max(500),
  content: z.string().trim().min(50),
  coverImageUrl: z.string().regex(/^\/image\/\d{6}\/[a-z0-9]+(?:-[a-z0-9]+)*$/),
  coverImagePath: z.string().regex(/^\d{6}\/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/),
  coverImageAlt: z.string().trim().min(3).max(180),
  authorName: z.string().trim().min(2).max(80),
  status: z.enum(ARTICLE_STATUSES),
  publishDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function cleanDiscoveryText(value: string) {
  return value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*>]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function createGeoSummary(category: string, excerpt: string, content: string) {
  return cleanDiscoveryText(`${category}: ${excerpt} ${content}`).slice(0, 800).trim();
}

export type ArticleFormState = {
  status: "idle" | "error" | "success";
  message: string;
  path?: string;
  articleStatus?: "draft" | "published";
};

export async function publishArticle(
  _previousState: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  if (!(await isAdminAuthenticated())) redirect("/admlog");

  const parsed = articleSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    coverImageUrl: formData.get("coverImageUrl"),
    coverImagePath: formData.get("coverImagePath"),
    coverImageAlt: formData.get("coverImageAlt"),
    authorName: formData.get("authorName"),
    status: formData.get("status"),
    publishDate: formData.get("publishDate"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check every required field, select a gallery image and make sure the main content is at least 50 characters.",
    };
  }

  const slug = slugifyArticleTitle(parsed.data.title);
  if (!slug) return { status: "error", message: "The title needs letters or numbers to create a URL." };

  try {
    const result = await createArticle({
      ...parsed.data,
      slug,
      seoTitle: parsed.data.title,
      seoDescription: parsed.data.excerpt.slice(0, 320),
      geoSummary: createGeoSummary(parsed.data.category, parsed.data.excerpt, parsed.data.content),
    });
    revalidatePath("/article");
    revalidatePath(result.path);
    revalidatePath("/sitemap.xml");
    revalidatePath("/prodarticle");

    return {
      status: "success",
      message: result.status === "published"
        ? "Article published. The public page is ready."
        : "Draft saved. It will remain private until published.",
      path: result.path,
      articleStatus: result.status,
    };
  } catch (error) {
    console.error("Article creation failed", error);
    return {
      status: "error",
      message: "The article could not be saved. A matching title may already exist for this publish date.",
    };
  }
}
