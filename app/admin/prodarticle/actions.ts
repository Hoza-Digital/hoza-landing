"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { canAccessArticleProduction } from "@/lib/admin-users";
import { articleContentToPlainText } from "@/lib/article-content";
import { ARTICLE_STATUSES, createArticle, slugifyArticleTitle } from "@/lib/articles";

function hasOnlySafeInlineImages(content: string) {
  return Array.from(content.matchAll(/!\[[^\]]*]\(([^)]+)\)/g))
    .every((match) => /^\/image\/\d{6}\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(match[1]));
}

const articleSchema = z.object({
  title: z.string().trim().min(3).max(180),
  category: z.string().trim().min(2).max(80),
  excerpt: z.string().trim().min(20).max(500),
  content: z.string().trim().min(50).refine(hasOnlySafeInlineImages),
  coverImageUrl: z.string().regex(/^\/image\/\d{6}\/[a-z0-9]+(?:-[a-z0-9]+)*$/),
  coverImagePath: z.string().regex(/^\d{6}\/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/),
  coverImageAlt: z.string().trim().min(3).max(180),
  status: z.enum(ARTICLE_STATUSES),
  publishDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  publishTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
});

function formatJakartaDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function createGeoSummary(category: string, excerpt: string, content: string) {
  return `${category}: ${excerpt} ${articleContentToPlainText(content)}`.slice(0, 800).trim();
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
  const admin = await getAdminSession();
  if (!admin) redirect("/admlog");
  if (!canAccessArticleProduction(admin.role)) notFound();

  const submittedStatus = formData.get("status");
  const isDraft = submittedStatus === "draft";
  const parsed = articleSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    coverImageUrl: formData.get("coverImageUrl"),
    coverImagePath: formData.get("coverImagePath"),
    coverImageAlt: formData.get("coverImageAlt"),
    status: submittedStatus,
    publishDate: isDraft ? formData.get("publishDate") : formatJakartaDate(new Date()),
    publishTime: isDraft ? formData.get("publishTime") : null,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check every required field, select a gallery image and make sure the main content is at least 50 characters.",
    };
  }

  const useCustomSlug = formData.get("useCustomSlug") === "true";
  let customSlug = "";
  if (useCustomSlug) {
    const submittedCustomSlug = z.string().trim().max(160).safeParse(formData.get("customSlug") ?? "");
    if (!submittedCustomSlug.success) {
      return { status: "error", message: "The custom slug must be 160 characters or fewer." };
    }
    customSlug = submittedCustomSlug.data;
  }

  const slug = slugifyArticleTitle(useCustomSlug ? customSlug : parsed.data.title);
  if (!slug) {
    return {
      status: "error",
      message: useCustomSlug
        ? "Enter a custom slug containing letters or numbers."
        : "The title needs letters or numbers to create a URL.",
    };
  }

  let scheduledFor: string | null = null;
  if (parsed.data.status === "draft") {
    if (!parsed.data.publishTime) {
      return { status: "error", message: "Choose a publication date and time for the draft." };
    }

    const scheduledDate = new Date(`${parsed.data.publishDate}T${parsed.data.publishTime}:00+07:00`);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
      return { status: "error", message: "Choose a future publication date and time in WIB." };
    }
    scheduledFor = scheduledDate.toISOString();
  }

  try {
    const result = await createArticle({
      ...parsed.data,
      authorName: admin.name,
      slug,
      scheduledFor,
      seoTitle: parsed.data.title,
      seoDescription: parsed.data.excerpt.slice(0, 320),
      geoSummary: createGeoSummary(parsed.data.category, parsed.data.excerpt, parsed.data.content),
    });
    revalidatePath("/article");
    revalidatePath(result.path);
    revalidatePath("/sitemap.xml");
    revalidatePath("/admin/prodarticle");

    return {
      status: "success",
      message: result.status === "published"
        ? "Article published. The public page is ready."
        : "Draft saved with its target publication date and time. It will remain private until published.",
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
