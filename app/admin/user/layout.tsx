import type { Metadata } from "next";
import "./user.css";

export const metadata: Metadata = {
  title: "User Management — Hoza",
  description: "Private Hoza role and user administration.",
  robots: { index: false, follow: false },
};

export default function UserManagementLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
