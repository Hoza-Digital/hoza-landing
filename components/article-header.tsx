import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./logo";

export function ArticleHeader() {
  return (
    <header className="article-header">
      <Link className="article-brand" href="/" aria-label="Hoza home">
        <Logo decorative />
        <span>FIELD NOTES</span>
      </Link>
      <nav aria-label="Article navigation">
        <Link href="/#capabilities">Services</Link>
        <Link href="/#process">Process</Link>
        <Link href="/#contact">Contact</Link>
        <Link className="is-current" href="/article">Article</Link>
      </nav>
      <Link className="article-header-cta" href="/#contact">
        Start a project <ArrowUpRight aria-hidden="true" />
      </Link>
    </header>
  );
}
