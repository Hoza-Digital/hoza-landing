import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArticleHeader } from "@/components/article-header";
import { ArticleFeed } from "@/components/article-feed";
import { Footer } from "@/components/footer";
import { articleListHref, parseArticlePage } from "@/lib/article-pagination";
import { getArticleBatch, listArticleCategories } from "@/lib/public-articles";

type ArticleIndexProps = { searchParams: Promise<{ category?: string | string[]; page?: string | string[] }> };

async function ArticleResults({ searchParams }: ArticleIndexProps) {
  const params = await searchParams;
  if (Array.isArray(params.page) || Array.isArray(params.category)) notFound();
  const page = parseArticlePage(params.page);
  const category = (params.category ?? "").trim();
  if (!page || category.length > 80) notFound();
  const [categories, requestedBatch] = await Promise.all([listArticleCategories(), getArticleBatch(page, 0, category)]);
  const selectedCategory = categories.find((item) => item.toLowerCase() === category.toLowerCase()) ?? category;
  const initialBatch = selectedCategory === category ? requestedBatch : await getArticleBatch(page, 0, selectedCategory);
  return (
    <>
      <nav className="article-categories" aria-label="Article categories">
        <Link className={!category ? "is-active" : ""} aria-current={!category ? "page" : undefined} href="/article">All signals</Link>
        {categories.map((item) => (
          <Link className={selectedCategory === item ? "is-active" : ""} aria-current={selectedCategory === item ? "page" : undefined} href={articleListHref(1, item)} key={item}>{item}</Link>
        ))}
      </nav>
      <ArticleFeed key={`${page}:${selectedCategory}:${initialBatch.articles[0]?.id ?? "empty"}:${initialBatch.total}`} initialBatch={initialBatch} page={page} category={selectedCategory} />
    </>
  );
}

export default function ArticleIndexPage(props: ArticleIndexProps) {
  return (
    <>
      <a className="skip-link" href="#article-list">Skip to articles</a>
      <ArticleHeader />
      <main className="article-index">
        <section className="article-hero" aria-labelledby="article-heading">
          <div><p className="article-kicker"><i /> Hoza field notes</p><h1 id="article-heading">IDEAS FOR<br /><em>FORWARD MOTION.</em></h1></div>
          <p>Clear thinking for teams shaping websites, products and smarter operations. Written from the work, built to be useful.</p>
        </section>
        <Suspense fallback={<div id="article-list" className="article-loading" role="status">Loading the latest article…</div>}><ArticleResults {...props} /></Suspense>
      </main>
      <Footer />
    </>
  );
}
