import pdfParse from "pdf-parse";

const MIN_CHARS_FOR_TEXT_PDF = 40;

export async function extractPdfText(buffer: Buffer): Promise<string | null> {
  const { text } = await pdfParse(buffer);
  const trimmed = text.trim();
  return trimmed.length >= MIN_CHARS_FOR_TEXT_PDF ? trimmed : null;
}
