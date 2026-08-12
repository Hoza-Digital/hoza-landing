import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { cache, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { ArticleHeader } from "@/components/article-header";
import { articleContentToPlainText } from "@/lib/article-content";
import { getPublishedArticle } from "@/lib/articles";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{ date: string; slug: string }>;
};

const getArticle = cache(getPublishedArticle);
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hozadigital.com").replace(/\/+$/, "");

function absoluteUrl(value: string) {
  return new URL(value, `${siteUrl}/`).toString();
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" })
    .format(new Date(`${date}T00:00:00Z`));
}

function safeArticleLink(href: string) {
  return /^(https?:\/\/|mailto:|\/|#)/i.test(href) ? href : null;
}

function renderInlineContent(content: string, keyPrefix: string): ReactNode[] {
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)]\(([^)\s]+)\)/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of content.matchAll(pattern)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > cursor) nodes.push(content.slice(cursor, matchIndex));
    const key = `${keyPrefix}-${matchIndex}`;

    if (match[1]) nodes.push(<strong key={key}>{renderInlineContent(match[1], `${key}-strong`)}</strong>);
    else if (match[2]) nodes.push(<em key={key}>{renderInlineContent(match[2], `${key}-em`)}</em>);
    else {
      const href = safeArticleLink(match[4]);
      nodes.push(href
        ? <a key={key} href={href} {...(/^https?:\/\//i.test(href) ? { target: "_blank", rel: "noreferrer noopener" } : {})}>{match[3]}</a>
        : match[3]);
    }
    cursor = matchIndex + match[0].length;
  }

  if (cursor < content.length) nodes.push(content.slice(cursor));
  return nodes;
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
    const imageMatch = line.match(/^!\[([^\]]*)]\((\/image\/\d{6}\/[a-z0-9]+(?:-[a-z0-9]+)*)\)$/);
    if (imageMatch) {
      blocks.push(
        <figure className="article-inline-image" key={key}>
          <Image src={imageMatch[2]} alt={imageMatch[1]} width={1600} height={900} sizes="(max-width: 900px) 100vw, 48rem" />
        </figure>,
      );
      index += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(<h3 key={key}>{renderInlineContent(line.slice(4), key)}</h3>);
      index += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(<h2 key={key}>{renderInlineContent(line.slice(3), key)}</h2>);
      index += 1;
      continue;
    }
    if (line.startsWith("> ")) {
      blocks.push(<blockquote key={key}>{renderInlineContent(line.slice(2), key)}</blockquote>);
      index += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }
      blocks.push(<ul key={key}>{items.map((item, itemIndex) => <li key={`${itemIndex}-${item}`}>{renderInlineContent(item, `${key}-${itemIndex}`)}</li>)}</ul>);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push(<ol key={key}>{items.map((item, itemIndex) => <li key={`${itemIndex}-${item}`}>{renderInlineContent(item, `${key}-${itemIndex}`)}</li>)}</ol>);
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(## |### |> |- |\d+\.\s)/.test(lines[index].trim())) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={key}>{renderInlineContent(paragraph.join(" "), key)}</p>);
  }

  return blocks;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { date, slug } = await params;
  const article = await getArticle(date, slug);
  if (!article) return { title: "Article not found — Hoza Digital" };
  const path = `/article/${date}/${article.slug}`;
  const socialImageUrl = absoluteUrl(`${path}/social-image?v=${encodeURIComponent(article.updatedAt)}`);

  return {
    title: article.seoTitle,
    description: article.seoDescription,
    category: article.category,
    authors: [{ name: article.authorName }],
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      siteName: "Hoza Digital",
      locale: "en_US",
      title: article.seoTitle,
      description: article.seoDescription,
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt,
      authors: [article.authorName],
      section: article.category,
      images: [{
        url: socialImageUrl,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: article.coverImageAlt,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle,
      description: article.seoDescription,
      images: [{ url: socialImageUrl, alt: article.coverImageAlt }],
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { date, slug } = await params;
  if (!/^\d{6}$/.test(date)) notFound();
  const article = await getArticle(date, slug);
  if (!article) notFound();

  const canonical = `${siteUrl}/article/${date}/${article.slug}`;
  const coverImageUrl = absoluteUrl(article.coverImageUrl);
  const articleBody = articleContentToPlainText(article.content);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.seoDescription,
    articleSection: article.category,
    image: [coverImageUrl],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: canonical,
    author: { "@type": "Organization", name: article.authorName },
    publisher: { "@type": "Organization", name: "Hoza Digital", url: siteUrl },
    about: article.geoSummary || article.excerpt,
    articleBody,
    wordCount: articleBody ? articleBody.split(/\s+/).length : 0,
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
