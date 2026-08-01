import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ArticleHeader } from "@/components/article-header";
import { articlePath, listPublishedArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

type ArticleIndexProps = {
  searchParams: Promise<{ category?: string }>;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(`${date}T00:00:00Z`))
    .toUpperCase();
}

export default async function ArticleIndexPage({ searchParams }: ArticleIndexProps) {
  const [{ category }, articles] = await Promise.all([searchParams, listPublishedArticles()]);
  const categories = [...new Set(articles.map((article) => article.category))];
  const selectedCategory = categories.find((item) => item.toLowerCase() === category?.toLowerCase());
  const visibleArticles = selectedCategory
    ? articles.filter((article) => article.category === selectedCategory)
    : articles;

  return (
    <>
      <a className="skip-link" href="#article-list">Skip to articles</a>
      <ArticleHeader />
      <main className="article-index">
        <section className="article-hero" aria-labelledby="article-heading">
          <div>
            <p className="article-kicker"><i /> Hoza field notes</p>
            <h1 id="article-heading">IDEAS FOR<br /><em>FORWARD MOTION.</em></h1>
          </div>
          <p>Clear thinking for teams shaping websites, products and smarter operations. Written from the work, built to be useful.</p>
        </section>

        <nav className="article-categories" aria-label="Article categories">
          <Link className={!selectedCategory ? "is-active" : ""} href="/article">All signals</Link>
          {categories.map((item) => (
            <Link
              className={selectedCategory === item ? "is-active" : ""}
              href={`/article?category=${encodeURIComponent(item)}`}
              key={item}
            >
              {item}
            </Link>
          ))}
        </nav>

        <section id="article-list" className="article-grid" aria-live="polite">
          {visibleArticles.map((article, index) => (
            <article className="article-card" key={article.id}>
              <Link href={articlePath(article)} aria-label={`Read ${article.title}`}>
                <div className="article-card-image">
                  <Image
                    src={article.coverImageUrl}
                    alt={article.coverImageAlt}
                    fill
                    priority={index < 3}
                    sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"
                  />
                  <span>{article.category}</span>
                </div>
                <div className="article-card-copy">
                  <h2>{article.title}</h2>
                  <p>{article.excerpt}</p>
                </div>
                <footer>
                  <div><strong>{article.authorName}</strong><span>{formatDate(article.publishDate)}</span></div>
                  <span className="article-card-arrow"><ArrowUpRight aria-hidden="true" /></span>
                </footer>
              </Link>
            </article>
          ))}

          {!visibleArticles.length && (
            <div className="article-empty">
              <span>00 / SIGNALS</span>
              <h2>THE NEXT IDEA<br />IS IN MOTION.</h2>
              <p>{selectedCategory ? "No published article is available in this category yet." : "The first Hoza field note is being prepared."}</p>
              {selectedCategory && <Link href="/article">View all articles <ArrowUpRight aria-hidden="true" /></Link>}
            </div>
          )}
        </section>
      </main>
      <footer className="article-footer">
        <span>HOZA DIGITAL / FIELD NOTES</span>
        <Link href="/">Back to studio <ArrowUpRight aria-hidden="true" /></Link>
      </footer>
    </>
  );
}
