import { pdf } from "pdf-to-img";

// Scanned PDFs can run to many pages; cap how many we rasterize+OCR per
// request so a large upload can't stall the server.
const MAX_PAGES = 5;

export async function renderPdfPagesToPngs(buffer: Buffer): Promise<Buffer[]> {
  const doc = await pdf(buffer, { scale: 2 });
  const pageCount = Math.min(doc.length, MAX_PAGES);
  const images: Buffer[] = [];

  let pageNumber = 1;
  for await (const page of doc) {
    if (pageNumber > pageCount) break;
    images.push(page);
    pageNumber++;
  }

  return images;
}
