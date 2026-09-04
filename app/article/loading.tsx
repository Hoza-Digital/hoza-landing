import { ArticleHeader } from "@/components/article-header";

export default function ArticleLoading() {
  return <><ArticleHeader /><main className="article-index"><div className="article-loading" role="status">Loading article…</div></main></>;
}
