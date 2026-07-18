import type { FastifyInstance } from "fastify";
import { extractPdfText } from "../extraction/pdfText.js";
import { extractImageText, extractTextFromImages } from "../extraction/ocr.js";
import { renderPdfPagesToPngs } from "../extraction/pdfImages.js";
import { analyzeReportText } from "../ai/analyze.js";
import { findUnsafeLanguage } from "../safety/checkLanguage.js";
import { reportSchema, type Report } from "../schemas/report.js";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_SAFETY_ATTEMPTS = 2;

// Retries the AI call if unsafe (diagnostic-sounding) language slips through
// the prompt-level guard — ARCHITECTURE.md §7.
async function analyzeUntilSafe(rawText: string): Promise<Report | null> {
  for (let attempt = 1; attempt <= MAX_SAFETY_ATTEMPTS; attempt++) {
    const report = await analyzeReportText(rawText);
    const unsafe = findUnsafeLanguage(report);
    if (unsafe.length === 0) return report;
  }
  return null;
}

const errorSchema = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"]
} as const;

export async function analyzeRoutes(app: FastifyInstance) {
  app.post(
    "/api/analyze",
    {
      schema: {
        response: {
          200: reportSchema,
          400: errorSchema,
          422: errorSchema,
          502: errorSchema
        }
      }
    },
    async (request, reply) => {
      const file = await request.file({
        limits: { fileSize: MAX_FILE_BYTES }
      });

      if (!file) {
        return reply.code(400).send({ error: "No file uploaded" });
      }

      const buffer = await file.toBuffer();
      const mimetype = file.mimetype;

      let rawText: string | null = null;

      if (mimetype === "application/pdf") {
        rawText = await extractPdfText(buffer);
        if (!rawText) {
          // No text layer — likely a scanned PDF. Rasterize pages and OCR them.
          const pageImages = await renderPdfPagesToPngs(buffer);
          rawText = await extractTextFromImages(pageImages);
        }
        if (!rawText || rawText.length < 20) {
          return reply.code(422).send({
            error:
              "Couldn't read this PDF. It may be a low-quality scan — try a clearer copy."
          });
        }
      } else if (mimetype === "image/jpeg" || mimetype === "image/png") {
        rawText = await extractImageText(buffer);
        if (!rawText || rawText.length < 20) {
          return reply.code(422).send({
            error: "Couldn't read this image clearly. Try a clearer scan."
          });
        }
      } else {
        return reply.code(400).send({
          error: "Unsupported file type. Please upload a PDF, JPG, or PNG."
        });
      }

      let report: Report | null;
      try {
        report = await analyzeUntilSafe(rawText);
      } catch (err) {
        request.log.error(err);
        return reply
          .code(502)
          .send({ error: "Analysis failed. Please try again." });
      }

      if (!report) {
        request.log.warn("Unsafe language persisted after retry");
        return reply.code(502).send({
          error: "Analysis produced an invalid response. Please try again."
        });
      }

      return reply.send(report);
    }
  );
}
