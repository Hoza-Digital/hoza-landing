import type { Metadata } from "next";
import { CursorLight } from "@/components/cursor-light";
import { EnquiryModal } from "@/components/enquiry-modal";
import "./article.css";

export const metadata: Metadata = {
  title: "Articles — Hoza Digital",
  description: "Practical thinking on digital products, websites, automation and building business momentum.",
  alternates: { canonical: "/article" },
  openGraph: {
    type: "website",
    url: "/article",
    title: "Articles — Hoza Digital",
    description: "Ideas and practical field notes for teams building digital products and systems.",
  },
};

export default function ArticleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="article-root">
      <CursorLight />
      <EnquiryModal />
      {children}
    </div>
  );
}
