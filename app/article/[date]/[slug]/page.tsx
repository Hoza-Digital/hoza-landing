import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { cache, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { ArticleHeader } from "@/components/article-header";
import { getPublishedArticle } from "@/lib/articles";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{ date: string; slug: string }>;
};

const getArticle = cache(getPublishedArticle);

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" })
    .format(new Date(`${date}T00:00:00Z`));
}

function renderContent(content: string): ReactNode[] {
  const lines = content.replaceAll("\r\n", "\n").split("\n");
  const blocks: ReactNode[] = [];

  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const key = `${index}-${line.slice(0, 24)}`;
    if (line.startsWith("### ")) {
      blocks.push(<h3 key={key}>{line.slice(4)}</h3>);
      index += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(<h2 key={key}>{line.slice(3)}</h2>);
      index += 1;
      continue;
    }
    if (line.startsWith("> ")) {
      blocks.push(<blockquote key={key}>{line.slice(2)}</blockquote>);
      index += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }
      blocks.push(<ul key={key}>{items.map((item, itemIndex) => <li key={`${itemIndex}-${item}`}>{item}</li>)}</ul>);
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(## |### |> |- )/.test(lines[index].trim())) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={key}>{paragraph.join(" ")}</p>);
  }

  return blocks;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { date, slug } = await params;
  const article = await getArticle(date, slug);
  if (!article) return { title: "Article not found — Hoza Digital" };
  const path = `/article/${date}/${article.slug}`;

  return {
    title: article.seoTitle,
    description: article.seoDescription,
    category: article.category,
    authors: [{ name: article.authorName }],
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      title: article.seoTitle,
      description: article.seoDescription,
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt,
      authors: [article.authorName],
      section: article.category,
      images: [{ url: article.coverImageUrl, alt: article.coverImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle,
      description: article.seoDescription,
      images: [article.coverImageUrl],
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { date, slug } = await params;
  if (!/^\d{6}$/.test(date)) notFound();
  const article = await getArticle(date, slug);
  if (!article) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hozadigital.com";
  const canonical = `${siteUrl}/article/${date}/${article.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.seoDescription,
    articleSection: article.category,
    image: [article.coverImageUrl],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: canonical,
    author: { "@type": "Organization", name: article.authorName },
    publisher: { "@type": "Organization", name: "Hoza Digital", url: siteUrl },
    about: article.geoSummary || article.excerpt,
  };

  return (
    <>
      <a className="skip-link" href="#article-content">Skip to article</a>
      <ArticleHeader />
      <main className="article-detail">
        <Link className="article-back" href="/article"><ArrowLeft aria-hidden="true" /> All articles</Link>
        <header className="article-detail-heading">
          <p><span>{article.category}</span> / {formatDate(article.publishDate)}</p>
          <h1>{article.title}</h1>
          <div><strong>{article.authorName}</strong><span>{article.excerpt}</span></div>
        </header>

        <figure className="article-cover">
          <Image
            src={article.coverImageUrl}
            alt={article.coverImageAlt}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 84vw"
          />
        </figure>

        <div id="article-content" className="article-body">
          <aside><span>FIELD NOTE</span><strong>{article.category}</strong><i /></aside>
          <article>{renderContent(article.content)}</article>
        </div>

        <section className="article-next-step">
          <span>READY TO MOVE?</span>
          <h2>TURN THE IDEA<br />INTO MOMENTUM.</h2>
          <Link href="/#contact">Start a project <ArrowUpRight aria-hidden="true" /></Link>
        </section>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
