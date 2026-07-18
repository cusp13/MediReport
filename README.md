# MediReport AI

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system design.

## Run locally

### Backend

```
cd backend
cp .env.example .env   # fill in OPENAI_API_KEY
npm install
npm run dev             # http://localhost:4000
```

### Frontend

```
cd frontend
npm install
npm run dev             # http://localhost:1234
```

Upload a PDF, JPG, or PNG lab report in the browser. Scanned-PDF OCR and the
multi-language differentiator are not wired yet (see ARCHITECTURE.md §10 for
the day-by-day build sequence).
