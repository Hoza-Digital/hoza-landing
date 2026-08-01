import type { Metadata } from "next";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "Project Signals — Hoza",
  description: "Private Hoza project enquiry records.",
  robots: { index: false, follow: false },
};

export default function ProjectSignalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-root">{children}</div>;
}
