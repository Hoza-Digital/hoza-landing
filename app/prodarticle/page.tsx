import { redirect } from "next/navigation";
import { AdminTopbar } from "@/app/admin/admin-topbar";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listAdminArticles, listArticleImages } from "@/lib/articles";
import { ArticleEditor } from "./article-editor";

export const dynamic = "force-dynamic";

function formatJakartaDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function formatJakartaTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export default async function ProduceArticlePage() {
  if (!(await isAdminAuthenticated())) redirect("/admlog");

  const [images, articles] = await Promise.all([
    listArticleImages(),
    listAdminArticles(),
  ]);

  const now = new Date();
  const draftTarget = new Date(now.getTime() + 60 * 60 * 1000);

  return (
    <main className="admin-dashboard prodarticle-page">
      <AdminTopbar />
      <ArticleEditor
        initialImages={images}
        articles={articles}
        defaultPublishDate={formatJakartaDate(now)}
        defaultDraftDate={formatJakartaDate(draftTarget)}
        defaultDraftTime={formatJakartaTime(draftTarget)}
      />
    </main>
  );
}
