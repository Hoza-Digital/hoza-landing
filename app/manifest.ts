import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hoza — Fast Forward",
    short_name: "Hoza",
    description: "Websites, apps and automation built fast.",
    start_url: "/",
    display: "standalone",
    background_color: "#08050D",
    theme_color: "#08050D",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
