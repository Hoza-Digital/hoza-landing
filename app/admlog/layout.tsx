import type { Metadata } from "next";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "Admin Login — Hoza",
  description: "Private Hoza administration access.",
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-root">{children}</div>;
}
