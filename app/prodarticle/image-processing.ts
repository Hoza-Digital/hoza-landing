import type { ArticleImage } from "@/lib/articles";

export const MAX_IMAGE_BYTES = 1024 * 1024;
const TARGET_IMAGE_BYTES = 940 * 1024;

export type CompressedImage = {
  blob: Blob;
  width: number;
  height: number;
  originalName: string;
};

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob || blob.type !== "image/webp") reject(new Error("This browser could not create a WebP image."));
      else resolve(blob);
    }, "image/webp", quality);
  });
}

export async function compressToWebp(file: File): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file);
  const initialScale = Math.min(1, 1920 / bitmap.width, 1280 / bitmap.height);
  let width = Math.max(1, Math.round(bitmap.width * initialScale));
  let height = Math.max(1, Math.round(bitmap.height * initialScale));

  try {
    for (let resizeAttempt = 0; resizeAttempt < 6; resizeAttempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("The image editor is not available in this browser.");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of [.88, .8, .72, .64, .56]) {
        const blob = await canvasToBlob(canvas, quality);
        if (blob.size <= TARGET_IMAGE_BYTES) {
          return {
            blob,
            width,
            height,
            originalName: `${file.name.replace(/\.[^.]+$/, "") || "article-image"}.webp`,
          };
        }
      }

      width = Math.max(1, Math.round(width * .84));
      height = Math.max(1, Math.round(height * .84));
    }
  } finally {
    bitmap.close();
  }

  throw new Error("The image could not be reduced below 1 MB. Try a simpler or smaller source image.");
}

export function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function uploadArticleImage(compressed: CompressedImage, altText: string): Promise<ArticleImage> {
  const response = await fetch("/api/admin/article-image", {
    method: "POST",
    headers: {
      "Content-Type": "image/webp",
      "x-file-name": encodeURIComponent(compressed.originalName),
      "x-image-alt": encodeURIComponent(altText),
      "x-image-width": String(compressed.width),
      "x-image-height": String(compressed.height),
    },
    body: compressed.blob,
  });
  const result = await response.json() as ArticleImage & { error?: string };
  if (!response.ok) throw new Error(result.error || "The image could not be uploaded.");
  return result;
}
