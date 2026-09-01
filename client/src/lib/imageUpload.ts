// Target size after compression; the hard cap matches the server's upload limit.
export const TARGET_IMAGE_BYTES = 800_000;
export const MAX_IMAGE_BYTES = 2_000_000;
const MAX_DIMENSION = 1600;
const MIN_QUALITY = 0.4;

const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error("Could not read the selected file."));
  reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
  reader.readAsDataURL(file);
});

const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const img = new Image();
  img.onerror = () => reject(new Error("The selected file is not a valid image."));
  img.onload = () => resolve(img);
  img.src = src;
});

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (!blob) {
      reject(new Error("Could not process the image."));
      return;
    }
    resolve(blob);
  }, "image/jpeg", quality);
});

/** Resizes and re-encodes an uploaded image client-side, targeting ~300-800KB. */
export const compressImageFile = async (file: File): Promise<Blob> => {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing is not supported in this browser.");
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.85;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > TARGET_IMAGE_BYTES && quality > MIN_QUALITY) {
    quality -= 0.15;
    blob = await canvasToBlob(canvas, quality);
  }
  return blob;
};

/** Uploads a compressed image blob and returns its hosted URL. */
export const uploadProductImage = async (blob: Blob): Promise<string> => {
  const response = await fetch("/api/admin/upload-image", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": blob.type || "image/jpeg" },
    body: blob,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || `Image upload failed (server responded with ${response.status}).`);
  }

  const payload = await response.json() as { url?: string };
  if (!payload.url) throw new Error("Image upload did not return a URL.");
  return payload.url;
};
