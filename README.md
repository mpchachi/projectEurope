# Language Coach — 12-Metric Post-Session Analytics

Post-session analytics dashboard for language tutors built for the **Preply Hackathon 2026**.  
Deepgram transcribes the audio with per-word metadata; Claude runs the pedagogical analysis.  
The React frontend shows 12 interactive metrics in a branded, editorial UI.

---

## Architecture

```
Student audio (WAV / Deepgram JSON)
        │
        ▼
  run.py  ──►  Deepgram Nova-2 (transcription + diarization + sentiment + topics)
        │
        ▼
  12 computed metrics  ──►  Claude claude-sonnet-4-6 (CEFR, errors, gray zones, summary)
        │
        ▼
  api.py (FastAPI)  ──►  PostgreSQL (session history)
        │
        ▼
  frontend/ (Vite + React + TypeScript)
```

---

## The 12 Metrics

| # | Metric | Source |
|---|--------|--------|
| 01 | **Talk Ratio** — who owned the floor | Deepgram diarization |
| 02 | **New Words** — vocabulary that appeared for the first time | Word diff vs. previous session |
| 03 | **Top 3 Errors** — what went wrong and the fix | Claude LLM |
| 05 | **Conversational Agency** — passenger or driver? | Deepgram intents |
| 06 | **Active Recall** — did last session stick? | Cross-session word overlap |
| 07 | **Self-Repair Rate** — mistakes caught before the tutor | Claude LLM |
| 08 | **Filler Pressure** — where hesitation clusters by topic | Deepgram topics + filler detection |
| 09 | **Code-Switching** — when English wasn't enough | Claude LLM |
| 10 | **Gray Zones** — grammar avoided, not just wrong | Claude LLM |
| 11 | **Sentiment Arc** — confidence shape through the session | Deepgram sentiment |
| 12 | **Topic Expansion** — is the student's world growing? | Deepgram topics |
| — | **CEFR Estimate** — A1→C2 level with reasoning | Claude LLM |

---

## Prerequisites

| Tool | Why |
|------|-----|
| Python 3.10+ | Backend |
| Node.js 18+ | Frontend build |
| [Deepgram API key](https://console.deepgram.com/) | Audio transcription |
| [Anthropic API key](https://console.anthropic.com/) | LLM analysis (Claude) |
| PostgreSQL database *(optional)* | Session history & progression |

---

## Setup

### 1. Clone

```bash
git clone https://github.com/mpchachi/projectEurope.git
cd projectEurope
```

### 2. Backend

```bash
pip install -r requirements.txt
```

Copy the env template and fill in your keys:

```bash
copy start.bat.example start.bat
# Then open start.bat and replace the placeholder values
```

`start.bat` sets three environment variables before launching the server:

```bat
set DEEPGRAM_API_KEY=dg_xxxxxxxxxxxxxxxxxxxx
set ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxx
set DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require  (optional)
```

> **Without `DATABASE_URL`** the app runs fine — session history is just disabled.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and proxies `/api` → `http://localhost:8000`.

### 4. Run everything

```bash
# Terminal 1 — backend (from project root)
start.bat          # Windows
# or:
DEEPGRAM_API_KEY=xxx ANTHROPIC_API_KEY=xxx uvicorn api:app --reload --port 8000   # Linux/Mac

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open `http://localhost:5173`, click **Import Conversation**, pick a preset.

---

## Sample Data

The `Student-1/` and `Student-2/` folders contain pre-built Deepgram JSON transcripts  
so you can run the demo without recording real audio:

| Folder | Description |
|--------|-------------|
| `Student-1/lesson-1` … `lesson-3` | Progression scenario — student improving over 3 sessions |
| `Student-2/lesson-1` … `lesson-3` | Plateau scenario — student at consistent level |

The two preset stories appear on the Import screen automatically.

---

## API Keys — Where to Get Them

### Deepgram
1. Sign up at [console.deepgram.com](https://console.deepgram.com/)
2. Create a project → **API Keys** → **Create a new API key**
3. Copy the key (starts with letters, ~40 chars)
4. Free tier: 200 hours of transcription/month

### Anthropic
1. Sign up at [console.anthropic.com](https://console.anthropic.com/)
2. **API Keys** → **Create Key**
3. Copy the key (starts with `sk-ant-api03-`)
4. Requires adding credits; analysis costs ~$0.01–0.03 per session

### PostgreSQL (optional)
Any Postgres instance works. Recommended free options:
- [Neon](https://neon.tech/) — serverless, free tier
- [Northflank](https://northflank.com/) — what this project uses; add a PostgreSQL addon
- [Supabase](https://supabase.com/) — free tier with dashboard

Connection string format:
```
postgresql://username:password@host:port/database?sslmode=require
```

---

## Project Structure

```
projectEurope/
├── run.py                  # Core pipeline: Deepgram → metrics → Claude
├── api.py                  # FastAPI server (REST API + serves frontend)
├── db.py                   # PostgreSQL persistence (session history)
├── requirements.txt        # Python dependencies
├── start.bat.example       # Environment variable template (copy → start.bat)
├── Student-1/              # Sample Deepgram transcripts — progression
├── Student-2/              # Sample Deepgram transcripts — plateau
└── frontend/               # Vite + React + TypeScript dashboard
    ├── src/
    │   ├── App.tsx          # Home / Import / Live screens
    │   ├── components/
    │   │   ├── Dashboard.tsx           # Main layout (sticky header, overview strip, 3 categories)
    │   │   └── metrics/                # One component per metric
    │   │       ├── TalkRatio.tsx       # SVG semi-donut
    │   │       ├── SentimentArc.tsx    # ECharts area chart
    │   │       ├── FillerPressure.tsx  # ECharts horizontal bar
    │   │       ├── GrayZones.tsx       # ECharts radar
    │   │       ├── AgencyGauge.tsx     # react-gauge-component
    │   │       └── ...
    │   └── types.ts         # TypeScript interfaces for all 12 metrics
    └── vite.config.ts       # Proxy /api → localhost:8000
```

---

## Stack

**Backend:** Python · FastAPI · Uvicorn · Deepgram SDK · Anthropic SDK · psycopg2  
**Frontend:** Vite · React 18 · TypeScript · Tailwind CSS v4 · Framer Motion · ECharts · react-gauge-component

---

## License

MIT
