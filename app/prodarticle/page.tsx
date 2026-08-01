import { redirect } from "next/navigation";
import { AdminTopbar } from "@/app/admin/admin-topbar";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listAdminArticles, listArticleImages } from "@/lib/articles";
import { ArticleEditor } from "./article-editor";

export const dynamic = "force-dynamic";

export default async function ProduceArticlePage() {
  if (!(await isAdminAuthenticated())) redirect("/admlog");

  const [images, articles] = await Promise.all([
    listArticleImages(),
    listAdminArticles(),
  ]);

  const today = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  return (
    <main className="admin-dashboard prodarticle-page">
      <AdminTopbar />
      <ArticleEditor initialImages={images} articles={articles} defaultPublishDate={today} />
    </main>
  );
}
