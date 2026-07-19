# MediReport AI

> **Understand your blood test. Track your recovery. Walk into every doctor's appointment informed.**

Most people get their lab report back and have no idea what they're looking at. MediReport turns confusing numbers into plain-language explanations — and for users managing active conditions, it generates a personalized AI recovery plan every single day based on their actual logged health data.

---

## What It Does

### Lab Report Analysis
Upload any blood test — PDF, photo, or scanned image. MediReport extracts every marker, flags what's abnormal, and explains it in plain language: what it means, what it may indicate, and what questions to ask your doctor.

### Daily Recovery Tracking
For users managing conditions like typhoid, dengue, malaria, diabetes, or anemia — log your daily health (food, exercise, water, sleep, mood) and get a personalized AI recovery plan every morning. The advice is built from your own logged data, not a generic template.

### Multi-Language Support
All explanations can be translated into 20+ languages on demand — making health literacy accessible regardless of language.

### Partner Clinic Network
Connects users to nearby and partner clinics directly from the report view.

---

## Features & How We Built Them

### 1. Smart Lab Report Parsing
**The problem:** Lab reports come in every format — clean PDFs, blurry phone photos, multi-column printed scans. A single extraction strategy fails on most real-world inputs.

**How we solved it:** Three-stage extraction pipeline:
- `pdf-parse` extracts text from digitally-generated PDFs in milliseconds
- If extraction yields no usable text, we render each PDF page to a PNG using a headless renderer
- `Tesseract.js` OCR processes the images as a final fallback

This covers the full range of real-world lab report formats, including low-quality scans common in India.

---

### 2. AI Marker Analysis with Strict Output Contract
**The problem:** Getting an LLM to return consistent, structured medical data — without hallucinating fields or drifting into diagnostic language — is non-trivial.

**How we solved it:** We locked a strict JSON schema on Day 1 and enforced it at every layer:
- OpenAI's structured output mode (`response_format: json_object`) with the schema in the system prompt
- Fastify's AJV-based route validation rejects any response that doesn't match the contract
- One automatic retry if the model returns malformed JSON

Every `mayIndicate` field is typed as an **array of possibilities** — the data shape itself makes a single-diagnosis response structurally impossible.

---

### 3. Non-Diagnostic Safety Layer
**The problem:** AI naturally wants to say "you have low iron." That's a diagnosis. In health, that's a legal and ethical line that cannot be crossed.

**How we solved it:** Defense in depth across three layers:
- **Prompt layer:** System prompt explicitly forbids diagnostic phrasing with examples
- **Backend layer:** Regex guard scans every `plainExplanation` and `mayIndicate` field for phrases like "you have", "diagnosed with", "confirms" — triggers a retry if found
- **UI layer:** Persistent disclaimer banner on every screen with results, not buried in a footer

The result: the system is genuinely useful without ever overstepping into diagnosis.

---

### 4. RAG-Powered Personalized Recovery Advice
**The problem:** Generic recovery advice ("drink water, rest") is useless. Advice needs to reflect where the patient actually is in their recovery — Day 2 acute typhoid vs. Day 10 recovery stage are completely different clinical situations.

**How we solved it:** Retrieval-Augmented Generation over two data sources:

1. **User's own health logs** — Each daily check-in (fever, energy, nausea, sleep, hydration, symptoms) is converted to a natural-language `logText` summary, embedded using `text-embedding-3-small` (1536 dimensions), and stored in Qdrant. At advice time, we retrieve the 3 most semantically similar past logs — showing the AI what this patient's actual recovery trajectory looks like.

2. **Medical knowledge base** — 80+ curated chunks covering typhoid, dengue, malaria, diabetes, and anemia (by stage: acute / recovery / resolved) are pre-embedded into Qdrant at server startup. The relevant guidelines for the user's condition + stage are retrieved at query time.

Both are injected as context before the AI generates the day's advice — grounding the response in real data, not assumptions.

---

### 5. MCP Tool Calls for Real-Time Data
**The problem:** The AI needs access to dynamic, structured data during advice generation — recovery trend lines, nutrition breakdowns, stage-specific guidelines — that can't all live in a static prompt.

**How we solved it:** We built a Model Context Protocol (MCP) stdio server that exposes three tools OpenAI can call during generation:

| Tool | What it returns |
|---|---|
| `get_recovery_trend` | Energy and fever averages over the last N days |
| `get_nutrition_info` | Calories, protein, carbs for a list of foods |
| `get_condition_stage_guidelines` | Diet, exercise, and red-flag symptoms for a condition + stage |

OpenAI calls these tools in up to 5 rounds, incorporating real-time data before producing the final structured advice (recovery assessment, meal plan, hydration target, exercise advice, warning flags, tomorrow's goal).

---

### 6. Weekly Health Summaries
Every Sunday — or after 7 daily logs — the system auto-generates a weekly summary: average energy, average fever, trend direction (improving / stable / worsening), and a natural-language narrative. These summaries are also embedded and stored in Qdrant, so future advice generation can see the patient's long-term trajectory.

---

### 7. Streaming Chat Q&A
After analysis, users can ask follow-up questions about their report in a streaming chat interface. The AI is conditioned on the full report context and constrained to the same non-diagnostic safety rules.

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Fastify 5.1 |
| Auth | JWT (`@fastify/jwt`) + bcryptjs |
| PDF Parsing | pdf-parse |
| OCR | Tesseract.js |
| Schema Validation | AJV (via Fastify) |

### AI / ML
| Layer | Technology |
|---|---|
| LLM | OpenAI `gpt-4o-mini` |
| Embeddings | OpenAI `text-embedding-3-small` (1536 dims) |
| Vector Database | Qdrant |
| RAG | Custom retrieval — `ragContext.ts` |
| Agent Protocol | Model Context Protocol (MCP) — stdio transport |

### Database
| Layer | Technology |
|---|---|
| Primary DB | MongoDB + Mongoose |
| Vector DB | Qdrant (3 collections: health logs, medical KB, weekly summaries) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Parcel 2 (zero-config) |
| Styling | Tailwind CSS 3 |
| File Upload | react-dropzone |
| Maps | OpenStreetMap (OSM) |

### Infrastructure
| Layer | Technology |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Vector DB | Qdrant Cloud |

---

## Architecture

```
                        ┌─────────────────────────────┐
                        │        React Frontend        │
                        │  (Parcel + Tailwind + TSX)   │
                        └────────────┬────────────────┘
                                     │ REST + Streaming
                        ┌────────────▼────────────────┐
                        │      Fastify Backend         │
                        │   (Node.js + TypeScript)     │
                        └──┬──────────┬───────────────┘
                           │          │
              ┌────────────▼──┐  ┌────▼──────────────┐
              │ Text Extraction│  │   OpenAI API       │
              │ pdf-parse /   │  │ gpt-4o-mini        │
              │ Tesseract OCR │  │ text-embedding-... │
              └───────────────┘  └────────────────────┘
                                          │
                        ┌─────────────────▼──────────────┐
                        │           Qdrant                │
                        │  health_logs | medical_kb       │
                        │  weekly_summaries               │
                        └─────────────────────────────────┘
                                          │
                        ┌─────────────────▼──────────────┐
                        │        MCP Stdio Server         │
                        │  get_recovery_trend             │
                        │  get_nutrition_info             │
                        │  get_condition_stage_guidelines │
                        └─────────────────────────────────┘
```

---

## Data Flow — Recovery Advice Generation

```
User logs daily health (fever, energy, sleep, food, exercise)
        ↓
logText string assembled → embedded (text-embedding-3-small)
        ↓
Vector stored in Qdrant [health_logs collection]
        ↓
User requests today's advice
        ↓
ragContext.ts: embed today's log → search Qdrant for:
  • 3 similar past health logs (same user, same condition)
  • Top medical guidelines (condition + stage)
  • Last 2 weekly summaries
        ↓
healthAdvice.ts: spawn MCP server → OpenAI tool call loop (≤5 rounds)
  OpenAI calls: get_recovery_trend, get_nutrition_info, get_condition_stage_guidelines
        ↓
Structured JSON advice generated:
  recoveryAssessment | dietPlan | hydrationTarget
  exerciseAdvice | warningFlags | tomorrowGoal
        ↓
Stored in DailyAdvice (MongoDB) — cached for rest of day
```

---

## Challenges We Faced

**1. Keeping AI non-diagnostic without killing usefulness**
The AI naturally wants to make definitive statements — that's a legal and ethical line in health. We built a three-layer safety system (prompt, backend regex, schema shape) and spent significant iteration time finding the balance between genuinely useful and appropriately cautious.

**2. OCR on real-world lab reports**
Lab reports from clinics in India often come as low-contrast scans, rotated phone photos, or multi-column printed sheets. We built a three-stage fallback pipeline (text extraction → PDF-to-image → OCR) to handle the full range without crashing.

**3. RAG context quality**
Semantic search returns vectors that are numerically close — not always clinically relevant. We spent significant effort tuning the `logText` format (the natural-language representation of each health log) so embeddings captured medical meaning, not just keyword overlap.

**4. MCP subprocess reliability**
The MCP server runs as a stdio subprocess during each advice request, managing up to 5 tool call rounds within a single API response. Getting this stable under real conditions — handling tool failures without aborting the entire generation — required careful error isolation.

**5. Dual-mode architecture**
The core lab analysis works with zero infrastructure — no signup, no database, instant results. The recovery tracking requires MongoDB and Qdrant. Designing a clean boundary where features degrade gracefully (not break) when infrastructure is absent added real complexity to every route and service layer.

---

## Running Locally

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Qdrant (local via Docker or Qdrant Cloud)
- OpenAI API key

### Backend

```bash
cd backend
cp .env.example .env
# Fill in: OPENAI_API_KEY, MONGODB_URI, QDRANT_URL, JWT_SECRET
npm install
npm run dev
# Runs on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:1234
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `OPENAI_MODEL` | No | Default: `gpt-4o-mini` |
| `MONGODB_URI` | No | Enables accounts + recovery tracking |
| `JWT_SECRET` | No | Required if MongoDB is enabled |
| `QDRANT_URL` | No | Default: `http://localhost:6333` — enables RAG |
| `PORT` | No | Default: `4000` |
| `FRONTEND_ORIGIN` | No | CORS whitelist |

> Without `MONGODB_URI` and `QDRANT_URL`, the app runs in anonymous mode — lab analysis works fully, recovery tracking is disabled.

### Sample Reports
Drop any of the files in `/samples/` to test the analysis without a real lab report.

---

## Project Structure

```
MediReport/
├── backend/
│   └── src/
│       ├── ai/              # OpenAI, embeddings, RAG, MCP, weekly digest
│       ├── auth/            # JWT middleware
│       ├── data/            # Static exercise + knowledge data
│       ├── extraction/      # pdf-parse + Tesseract OCR pipeline
│       ├── mcp/             # MCP stdio server (3 tools)
│       ├── models/          # MongoDB schemas (10 models)
│       ├── routes/          # Fastify API routes (13 routes)
│       ├── safety/          # Non-diagnostic language guard
│       └── schemas/         # JSON output contract (shared across layers)
├── frontend/
│   └── src/
│       ├── components/      # 28+ React components
│       ├── api/             # Backend client
│       ├── auth/            # Auth context
│       ├── lib/             # Utilities (trends, ranges, languages, sharing)
│       └── types/           # TypeScript types
└── samples/                 # Sample lab reports for testing
```

---

## Safety Guarantees

MediReport is not a medical device and makes no diagnostic claims. Every layer of the system enforces this:

- Structured output schema — `mayIndicate` is always an array of possibilities, never a single diagnosis field
- Backend regex guard — scans every AI response for diagnostic phrasing before it reaches the user
- Automatic retry — if unsafe language is detected, the request is regenerated
- Persistent UI disclaimer — visible on every screen with results

---

Built at a hackathon in 5 days. Solo dev + Claude Code.
