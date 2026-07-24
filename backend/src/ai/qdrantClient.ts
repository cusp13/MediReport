import { QdrantClient } from "@qdrant/js-client-rest";

const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";
const VECTOR_SIZE = 1536; // text-embedding-3-small dimension

let client: QdrantClient | null = null;

export function getQdrant(): QdrantClient {
  if (!client) {
    client = new QdrantClient({
      url: QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      checkCompatibility: false
    });
  }
  return client;
}

export const COLLECTIONS = {
  HEALTH_LOGS: "health_logs",
  MEDICAL_KNOWLEDGE: "medical_knowledge",
  WEEKLY_SUMMARIES: "weekly_summaries"
} as const;

export async function ensureCollections(): Promise<void> {
  const q = getQdrant();
  const existing = await q.getCollections();
  const names = existing.collections.map((c) => c.name);

  for (const name of Object.values(COLLECTIONS)) {
    if (!names.includes(name)) {
      await q.createCollection(name, {
        vectors: { size: VECTOR_SIZE, distance: "Cosine" }
      });
      console.info(`[qdrant] Created collection: ${name}`);
    }
  }
}
