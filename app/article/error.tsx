"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { ArticleHeader } from "@/components/article-header";

export default function ArticleError({ reset }: { reset: () => void }) {
  const router = useRouter();
  const retry = () => startTransition(() => { router.refresh(); reset(); });
  return <><ArticleHeader /><main className="article-index"><div className="article-error" role="alert">
    <h1>ARTICLES ARE TEMPORARILY UNAVAILABLE.</h1>
    <p>We couldn’t reach the article library. Please try again in a moment.</p>
    <button className="button button-primary" type="button" onClick={retry}>Try again</button>
    <Link href="/">Return to Hoza</Link>
  </div></main></>;
}
