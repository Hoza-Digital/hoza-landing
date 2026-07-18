import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoza.studio";

const bodyFont = Barlow({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const displayFont = Barlow_Condensed({
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Hoza — Websites, Apps and Automation Built Fast",
  description:
    "Hoza designs and develops websites, web applications, mobile products and automation systems for businesses in Indonesia, Singapore and worldwide.",
  applicationName: "Hoza",
  keywords: [
    "digital product studio",
    "web development Indonesia",
    "web development Singapore",
    "mobile app development",
    "business automation",
    "custom software",
  ],
  authors: [{ name: "Hoza" }],
  creator: "Hoza",
  publisher: "Hoza",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Hoza",
    title: "Hoza — Websites, Apps and Automation Built Fast",
    description:
      "Websites, applications, mobile products and automation systems built for businesses ready to move forward.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Hoza — We build digital things fast." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hoza — Websites, Apps and Automation Built Fast",
    description:
      "Websites, applications, mobile products and automation systems built for businesses ready to move forward.",
    images: ["/opengraph-image"],
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#08050D",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Hoza",
  url: siteUrl,
  description:
    "Hoza builds high-converting websites, web applications, mobile products, business automation systems and custom software.",
  areaServed: ["Indonesia", "Singapore", "Worldwide"],
  serviceType: [
    "Website Design and Development",
    "Landing Page Development",
    "Web Application Development",
    "Mobile Application Development",
    "Business Automation",
    "Custom Software Development",
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
