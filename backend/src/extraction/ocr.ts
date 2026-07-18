import { createWorker } from "tesseract.js";

export async function extractImageText(buffer: Buffer): Promise<string> {
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(buffer);
    return data.text.trim();
  } finally {
    await worker.terminate();
  }
}

// Reuses one worker across all pages of a scanned PDF instead of paying
// Tesseract's startup cost per page.
export async function extractTextFromImages(buffers: Buffer[]): Promise<string> {
  const worker = await createWorker("eng");
  try {
    const texts: string[] = [];
    for (const buffer of buffers) {
      const { data } = await worker.recognize(buffer);
      texts.push(data.text.trim());
    }
    return texts.join("\n\n");
  } finally {
    await worker.terminate();
  }
}
