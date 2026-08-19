import { callSupabaseRpc } from "./supabase";

export const ARTICLE_STATUSES = ["draft", "published"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export type ArticleImage = {
  id: number;
  storagePath: string;
  publicUrl: string;
  originalName: string;
  altText: string;
  sizeBytes: number;
  width: number;
  height: number;
  createdAt: string;
};

export type ArticleSummary = {
  id: number;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  coverImageUrl: string;
  coverImageAlt: string;
  authorName: string;
  publishDate: string;
  publishedAt: string | null;
  updatedAt: string;
  status?: ArticleStatus;
  createdAt?: string;
};

export type Article = ArticleSummary & {
  content: string;
  seoTitle: string;
  seoDescription: string;
  geoSummary: string;
};

export type NewArticle = {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  coverImagePath: string;
  coverImageAlt: string;
  authorName: string;
  seoTitle: string;
  seoDescription: string;
  geoSummary: string;
  status: ArticleStatus;
  publishDate: string;
  scheduledFor: string | null;
};

export type CreatedArticle = {
  id: number;
  slug: string;
  dateCode: string;
  status: ArticleStatus;
  path: string;
};

type ArticleImageRow = {
  id: number | string;
  storage_path: string;
  public_url: string;
  original_name: string;
  alt_text: string;
  size_bytes: number | string;
  width: number;
  height: number;
  created_at: string;
};

type ArticleSummaryRow = {
  id: number | string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  cover_image_url: string;
  cover_image_alt: string;
  author_name: string;
  publish_date: string;
  published_at: string | null;
  updated_at: string;
  status?: ArticleStatus;
  created_at?: string;
};

type ArticleRow = ArticleSummaryRow & {
  content: string;
  seo_title: string;
  seo_description: string;
  geo_summary: string;
};

function mapSummary(row: ArticleSummaryRow): ArticleSummary {
  return {
    id: Number(row.id),
    title: row.title,
    slug: row.slug,
    category: row.category,
    excerpt: row.excerpt,
    coverImageUrl: row.cover_image_url,
    coverImageAlt: row.cover_image_alt,
    authorName: row.author_name,
    publishDate: row.publish_date,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    ...(row.status ? { status: row.status } : {}),
    ...(row.created_at ? { createdAt: row.created_at } : {}),
  };
}

export function slugifyArticleTitle(title: string) {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

export function articleDateCode(publishDate: string) {
  return publishDate.replaceAll("-", "").slice(2);
}

export function articlePath(article: Pick<ArticleSummary, "publishDate" | "slug">) {
  return `/article/${articleDateCode(article.publishDate)}/${article.slug}`;
}

export async function listPublishedArticles(): Promise<ArticleSummary[]> {
  try {
    const rows = await callSupabaseRpc<ArticleSummaryRow[]>("hoza_list_published_articles");
    return rows.map(mapSummary);
  } catch (error) {
    console.error("Failed to list published articles:", error);
    return [];
  }
}

export async function getPublishedArticle(dateCode: string, slug: string): Promise<Article | null> {
  try {
    const rows = await callSupabaseRpc<ArticleRow[]>("hoza_get_published_article", {
      p_date_code: dateCode,
      p_slug: slug,
    });
    const row = rows[0];
    if (!row) return null;

    return {
      ...mapSummary(row),
      content: row.content,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      geoSummary: row.geo_summary,
    };
  } catch (error) {
    console.error("Failed to get published article:", error);
    return null;
  }
}

export async function listArticleImages(): Promise<ArticleImage[]> {
  const rows = await callSupabaseRpc<ArticleImageRow[]>("hoza_admin_list_article_images");
  return rows.map((row) => ({
    id: Number(row.id),
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    originalName: row.original_name,
    altText: row.alt_text,
    sizeBytes: Number(row.size_bytes),
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
  }));
}

export async function registerArticleImage(image: Omit<ArticleImage, "id" | "createdAt">) {
  return await callSupabaseRpc<number>("hoza_admin_register_article_image", {
    p_storage_path: image.storagePath,
    p_public_url: image.publicUrl,
    p_original_name: image.originalName,
    p_alt_text: image.altText,
    p_size_bytes: image.sizeBytes,
    p_width: image.width,
    p_height: image.height,
  });
}

export async function listAdminArticles(): Promise<ArticleSummary[]> {
  const rows = await callSupabaseRpc<ArticleSummaryRow[]>("hoza_admin_list_articles");
  return rows.map(mapSummary);
}

export async function createArticle(article: NewArticle): Promise<CreatedArticle> {
  return await callSupabaseRpc<CreatedArticle>("hoza_admin_create_article", {
    p_title: article.title,
    p_slug: article.slug,
    p_category: article.category,
    p_excerpt: article.excerpt,
    p_content: article.content,
    p_cover_image_url: article.coverImageUrl,
    p_cover_image_path: article.coverImagePath,
    p_cover_image_alt: article.coverImageAlt,
    p_author_name: article.authorName,
    p_seo_title: article.seoTitle,
    p_seo_description: article.seoDescription,
    p_geo_summary: article.geoSummary,
    p_status: article.status,
    p_publish_date: article.publishDate,
    p_scheduled_for: article.scheduledFor,
  });
}
