const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MAX_AVATAR_BYTES = 180 * 1024;

export type ProcessedAvatar = {
  dataUrl: string;
  fileName: string;
  sizeBytes: number;
};

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob || blob.type !== "image/webp") {
        reject(new Error("This browser could not create a WebP profile photo."));
      } else {
        resolve(blob);
      }
    }, "image/webp", quality);
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string"
      ? resolve(reader.result)
      : reject(new Error("The profile photo could not be prepared."));
    reader.onerror = () => reject(new Error("The profile photo could not be read."));
    reader.readAsDataURL(blob);
  });
}

export async function processUserAvatar(file: File): Promise<ProcessedAvatar> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a JPG, PNG or WebP image.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("The source photo must be smaller than 10 MB.");

  const bitmap = await createImageBitmap(file);
  if (!bitmap.width || !bitmap.height) {
    bitmap.close();
    throw new Error("The selected photo has invalid dimensions.");
  }

  const sourceSize = Math.min(bitmap.width, bitmap.height);
  const sourceX = Math.round((bitmap.width - sourceSize) / 2);
  const sourceY = Math.round((bitmap.height - sourceSize) / 2);

  try {
    for (const outputSize of [512, 448, 384, 320, 256]) {
      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("The image editor is not available in this browser.");

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        bitmap,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        outputSize,
        outputSize,
      );

      for (const quality of [.86, .78, .7, .62, .54]) {
        const blob = await canvasToBlob(canvas, quality);
        if (blob.size <= MAX_AVATAR_BYTES) {
          return {
            dataUrl: await blobToDataUrl(blob),
            fileName: `${file.name.replace(/\.[^.]+$/, "") || "profile-photo"}.webp`,
            sizeBytes: blob.size,
          };
        }
      }
    }
  } finally {
    bitmap.close();
  }

  throw new Error("The photo could not be reduced below 180 KB. Try a simpler image.");
}

export function formatAvatarBytes(bytes: number) {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
