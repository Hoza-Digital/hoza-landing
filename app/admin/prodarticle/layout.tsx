import type { Metadata } from "next";
import "./prodarticle.css";

export const metadata: Metadata = {
  title: "Produce Article — Hoza",
  description: "Private Hoza article production dashboard.",
  robots: { index: false, follow: false },
};

export default function ProduceArticleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
