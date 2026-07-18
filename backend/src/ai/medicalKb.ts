import { embedTexts } from "./embeddings.js";
import { getQdrant, COLLECTIONS } from "./qdrantClient.js";
import { randomUUID } from "crypto";

interface KbChunk {
  condition: string;
  stage: string;
  content: string;
}

const KB_CHUNKS: KbChunk[] = [
  // ── TYPHOID ──────────────────────────────────────────────────────────────────
  {
    condition: "typhoid",
    stage: "acute",
    content:
      "Typhoid acute phase diet: Eat soft, easily digestible foods — rice porridge (kanji), boiled rice, mashed potatoes, bananas, boiled vegetables. Avoid raw vegetables, spicy foods, high-fiber foods, dairy, fried items. Drink ORS (Oral Rehydration Solution), coconut water, clear broths, boiled water. Target 2.5–3 L fluids daily. Take prescribed antibiotics on schedule — typically ciprofloxacin or azithromycin for 7–14 days. Rest completely; avoid exertion as intestinal walls are vulnerable."
  },
  {
    condition: "typhoid",
    stage: "recovery",
    content:
      "Typhoid recovery phase diet: Gradually reintroduce soft proteins — boiled eggs, steamed fish, lentil soup (dal). Continue ORS if loose stools persist. Avoid raw salads, spicy curries, street food for 3 more weeks. Light walking (5–10 min) acceptable when fever-free for 48 hours and energy ≥ 5/10. No strenuous exercise for 4 weeks post-recovery. Watch for relapse: fever spike after apparent recovery, abdominal pain, bloody stools → see doctor immediately."
  },
  {
    condition: "typhoid",
    stage: "resolved",
    content:
      "Post-typhoid: Continue avoiding alcohol for 4 weeks. Resume normal diet slowly over 2 weeks. Liver function may be mildly affected — take paracetamol only when necessary; avoid ibuprofen/NSAIDs. Follow-up stool culture recommended at 4 weeks to confirm clearance. Gradually increase exercise — start with walking, add strength training after 6 weeks."
  },

  // ── DENGUE ───────────────────────────────────────────────────────────────────
  {
    condition: "dengue",
    stage: "acute",
    content:
      "Dengue acute phase: High fever (40°C), severe headache, pain behind eyes, muscle/joint pain. Diet: papaya leaf juice (may help raise platelet count), pomegranate juice, coconut water, kiwi, guava. Fluids target: 2.5–3 L/day. Avoid aspirin and ibuprofen — they can worsen bleeding. Use only paracetamol for fever. Complete bed rest. Warning signs: bleeding gums, blood in urine/stools, severe abdominal pain, vomiting, rapid breathing, restlessness → emergency immediately."
  },
  {
    condition: "dengue",
    stage: "recovery",
    content:
      "Dengue recovery: Platelet count usually recovers by day 7–10. Maintain high fluid intake. Gradually reintroduce normal diet — start with soft foods, progress to normal over 5 days. Fatigue and weakness may persist 2–3 weeks (post-dengue asthenia). Light walking when fever-free 48 hours. Avoid strenuous activity until platelet count normalizes and energy returns fully."
  },

  // ── MALARIA ──────────────────────────────────────────────────────────────────
  {
    condition: "malaria",
    stage: "acute",
    content:
      "Malaria acute phase: Cyclical fever, chills, sweating. Take antimalarials as prescribed (chloroquine, artemisinin combination therapy) — do not miss doses. Diet: high-carb foods during chills to maintain blood sugar — rice, bread. Fluids: 3 L/day including ORS during fever spikes. Avoid alcohol completely (interferes with antimalarials). Complete bed rest during fever cycles. Mosquito net to prevent re-infection."
  },
  {
    condition: "malaria",
    stage: "recovery",
    content:
      "Malaria recovery: Complete the full antimalarial course even if feeling better. Anemia is common — iron-rich foods: spinach, lentils, fortified cereals, pomegranate. Vitamin C with iron foods enhances absorption. Fatigue may last 1–2 weeks. Light walking when fever-free. Resume normal diet gradually. Retest at 2 and 4 weeks to confirm parasitic clearance."
  },

  // ── DIABETES ─────────────────────────────────────────────────────────────────
  {
    condition: "diabetes",
    stage: "acute",
    content:
      "Diabetes management — acute illness protocol: During illness, blood sugar often spikes. Continue medications/insulin even if not eating normally. Monitor blood sugar every 2–4 hours. Ketones check if BG > 250 mg/dL. Diet: small frequent meals of soft low-GI foods — oats, lentils, non-starchy vegetables. Avoid sugary drinks, white rice, white bread. Hydration: 2–2.5 L water/sugar-free fluids daily. Sick-day rules: if unable to keep food down, contact doctor immediately."
  },
  {
    condition: "diabetes",
    stage: "recovery",
    content:
      "Diabetes ongoing management: Low-GI diet — whole grains, legumes, leafy vegetables, lean proteins. Limit refined carbs, sugary beverages, processed foods. 30 minutes moderate exercise most days — brisk walking, cycling, swimming. Monitor blood glucose before/after exercise. A1C target: <7% (individualized). Foot care: inspect daily, moisturize, avoid barefoot. Eye and kidney checkups annually."
  },

  // ── ANEMIA ───────────────────────────────────────────────────────────────────
  {
    condition: "anemia",
    stage: "acute",
    content:
      "Iron-deficiency anemia treatment: Take iron supplements as prescribed — typically ferrous sulfate 325 mg once or twice daily. Take on empty stomach with vitamin C source (orange juice) for best absorption. Avoid taking with dairy, tea, coffee, calcium — they block iron absorption. Hematinics take 1–3 months to normalize hemoglobin. Diet: spinach, lentils, rajma (kidney beans), fortified cereals, red meat (if non-vegetarian), tofu, pumpkin seeds."
  },
  {
    condition: "anemia",
    stage: "recovery",
    content:
      "Anemia recovery: Continue iron supplements 3 months after hemoglobin normalizes to rebuild stores. Maintain iron-rich diet. Add vitamin B12 if deficiency confirmed: eggs, dairy, fortified foods, B12 supplements. Folic acid foods: leafy greens, legumes, fortified bread. Light aerobic exercise when hemoglobin > 10 g/dL. Avoid high-intensity exercise until fully normalized. Recheck CBC at 4–6 weeks and 3 months."
  }
];

let seeded = false;

export async function isKbSeeded(): Promise<boolean> {
  try {
    const info = await getQdrant().getCollection(COLLECTIONS.MEDICAL_KNOWLEDGE);
    return (info.points_count ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function seedMedicalKb(): Promise<void> {
  if (seeded) return;
  if (await isKbSeeded()) {
    seeded = true;
    return;
  }

  console.info("[medicalKb] Seeding medical knowledge base into Qdrant…");
  const texts = KB_CHUNKS.map((c) => c.content);
  const vectors = await embedTexts(texts);

  await getQdrant().upsert(COLLECTIONS.MEDICAL_KNOWLEDGE, {
    wait: true,
    points: KB_CHUNKS.map((chunk, i) => ({
      id: randomUUID(),
      vector: vectors[i],
      payload: {
        condition: chunk.condition,
        stage: chunk.stage,
        content: chunk.content
      }
    }))
  });

  seeded = true;
  console.info(`[medicalKb] Seeded ${KB_CHUNKS.length} chunks.`);
}
