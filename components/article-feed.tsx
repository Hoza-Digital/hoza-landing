"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ARTICLES_PER_PAGE, articleHref, articleListHref, type ArticleBatch } from "@/lib/article-pagination";
import type { ArticleSummary } from "@/lib/articles";

const dateFormat = new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

function ArticleCard({ article, first }: { article: ArticleSummary; first: boolean }) {
  return (
    <article className="article-card" data-article-id={article.id}>
      <Link href={articleHref(article)} prefetch={false} aria-label={`Read ${article.title}`}>
        <div className="article-card-image">
          <Image src={article.coverImageUrl} alt={article.coverImageAlt} fill priority={first} sizes="(max-width: 720px) calc(100vw - 4rem), (max-width: 1050px) 44vw, 28vw" />
          <span>{article.category}</span>
        </div>
        <div className="article-card-copy"><h2>{article.title}</h2><p>{article.excerpt}</p></div>
        <footer><div><strong>{article.authorName}</strong><time dateTime={article.publishDate}>{dateFormat.format(new Date(`${article.publishDate}T00:00:00Z`)).toUpperCase()}</time></div><span className="article-card-arrow"><ArrowUpRight aria-hidden="true" /></span></footer>
      </Link>
    </article>
  );
}

export function ArticleFeed({ initialBatch, page, category }: { initialBatch: ArticleBatch; page: number; category: string }) {
  const [articles, setArticles] = useState(initialBatch.articles);
  const [total, setTotal] = useState(initialBatch.total);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exhausted, setExhausted] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  const nextIndex = useRef(initialBatch.articles.length);
  const pageCount = Math.max(1, Math.ceil(total / ARTICLES_PER_PAGE));
  const pageSize = Math.min(ARTICLES_PER_PAGE, Math.max(0, total - (page - 1) * ARTICLES_PER_PAGE));
  const canLoad = !exhausted && articles.length < pageSize;

  const loadNext = useCallback(async () => {
    if (request.current || !canLoad) return;
    const controller = new AbortController();
    request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ page: String(page), index: String(nextIndex.current) });
      if (category) query.set("category", category);
      const response = await fetch(`/api/articles?${query}`, { signal: controller.signal });
      if (!response.ok) throw new Error("Unable to load the next article row.");
      const batch: ArticleBatch = await response.json();
      setTotal(batch.total);
      if (!batch.articles.length) setExhausted(true);
      else {
        nextIndex.current += batch.articles.length;
        setArticles((current) => [...current, ...batch.articles.filter((item) => !current.some((existing) => existing.id === item.id))]);
        if (nextIndex.current >= ARTICLES_PER_PAGE) setExhausted(true);
      }
    } catch {
      if (request.current === controller) setError("The next article row could not be loaded. Your place is saved.");
    } finally {
      window.clearTimeout(timeout);
      if (request.current === controller) { request.current = null; setLoading(false); }
    }
  }, [canLoad, category, page]);

  useEffect(() => () => { const pending = request.current; request.current = null; pending?.abort(); }, []);
  useEffect(() => {
    if (!canLoad || loading || error || !sentinel.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) void loadNext(); }, { rootMargin: "0px 0px 160px", threshold: 0 });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [canLoad, loading, error, loadNext]);

  return (
    <section id="article-list" className="article-results" aria-label="Published articles">
      <div className="article-list-status" role="status"><span>Newest first</span><span>{articles.length} of {pageSize} articles · Page {page} of {pageCount}</span></div>
      <div className="article-grid" aria-busy={loading}>
        {articles.map((article, index) => <ArticleCard key={article.id} article={article} first={index === 0} />)}
        {!articles.length && <div className="article-empty"><h2>{page > 1 ? "NO ARTICLES ON THIS PAGE." : "THE NEXT IDEA IS IN MOTION."}</h2><p>{category ? "No published articles are available here yet." : "The next Hoza field note is being prepared."}</p>{(category || page > 1) && <Link href="/article">View all articles <ArrowUpRight aria-hidden="true" /></Link>}</div>}
      </div>
      {canLoad && <div ref={sentinel} className="article-load-more">
        {error && <p role="alert">{error}</p>}
        <button type="button" onClick={() => void loadNext()} disabled={loading}>{loading ? <><Loader2 className="spin" aria-hidden="true" /> Loading next row…</> : error ? "Try again" : "Load next row"}</button>
        <p>Articles load one row at a time as you scroll. Up to 20 per page.</p>
      </div>}
      {!canLoad && pageCount > 1 && <nav className="article-pagination" aria-label="Article pagination">
        {page > 1 && <Link href={articleListHref(page - 1, category)}>Previous page</Link>}
        <span aria-current="page">Page {page} of {pageCount}</span>
        {page < pageCount && <Link href={articleListHref(page + 1, category)}>Next page <ArrowUpRight aria-hidden="true" /></Link>}
      </nav>}
      {!canLoad && total > 0 && page >= pageCount && <p className="article-end">You’re all caught up.</p>}
      <noscript><p>Enable JavaScript to load additional article rows.</p></noscript>
    </section>
  );
}
