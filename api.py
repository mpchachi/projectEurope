"""
api.py  —  Language Learning Dashboard · FastAPI Backend
Preply Hackathon 2026  |  Deepgram + Claude LLM

Endpoints:
  GET  /health                       → health check
  GET  /conversations                → list preset conversations
  GET  /analyze/preset/{preset_id}   → run (or cache-hit) a preset
  POST /analyze                      → custom sources
  POST /live/start                   → [placeholder] start recording
  POST /live/stop/{session_id}       → [placeholder] stop + analyze
  GET  /live/status/{session_id}     → [placeholder] SSE progress

Run:
  uvicorn api:app --reload --port 8000
"""

import json
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import db
from run import run_one   # re-uses the entire existing pipeline

# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(title="Language Coach API", version="1.0.0")
db.init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CACHE_DIR = Path("cache")
CACHE_DIR.mkdir(exist_ok=True)

# Serve the React SPA at /
@app.get("/", include_in_schema=False)
def frontend():
    return FileResponse("static/index.html")

# ─── Preset conversations ─────────────────────────────────────────────────────
#
# These are the "Import conversation" cards the frontend will show.
# When real recordings exist, add them here — same structure.
#
PRESETS = {
    "student1_progression": {
        "name": "Student 1 — Real Progression",
        "description": "Genuine A2→B1 improvement across 2 sessions",
        "mode": "preply",
        "sources": ["Student-1/lesson-1", "Student-1/lesson-3"],
        "student_id": "student-1",
        "story": "improvement",
        "badge": "PROGRESSION",
    },
    "student2_plateau": {
        "name": "Student 2 — Plateau Detected",
        "description": "B1 ceiling despite consistent practice — tutor strategy failing",
        "mode": "preply",
        "sources": ["Student-2/lesson-1", "Student-2/lesson-2"],
        "student_id": "student-2",
        "story": "plateau",
        "badge": "PLATEAU",
    },
    "cefr_range": {
        "name": "CEFR Range — A2 vs B2",
        "description": "What the 12 metrics look like at the extremes",
        "mode": "json",
        "sources": ["rich_simple.json", "rich_complex.json"],
        "student_id": "demo",
        "story": "cefr_range",
        "badge": "CEFR DEMO",
    },
    # ── Add real recorded sessions here once you have them ───────────────────
    # "session_live_001": {
    #     "name": "Live Session — 2026-04-16",
    #     "description": "Recorded roleplay: tutor + B1 student on travel topics",
    #     "mode": "audio",
    #     "sources": ["recordings/session_001.wav"],
    #     "student_id": "student-live",
    #     "story": "live",
    #     "badge": "LIVE",
    # },
}

# ─── (f, m, llm)  →  clean frontend-ready dict ───────────────────────────────

def _talk_status(tr: dict) -> str:
    if tr["passive"]:          return "passive"
    if tr["student_pct"] >= 55: return "healthy"
    return "ok"

def _words_signal(nw: dict, is_first: bool) -> str:
    if nw["new_n"] == 0 and not is_first: return "plateau"
    if nw["new_n"] >= 20:                 return "strong_growth"
    return "normal"

def _agency_status(score: float) -> str:
    if score <= 2:  return "reactive"
    if score >= 6:  return "proactive"
    return "developing"

def _sentiment_block(arc: list) -> dict:
    if not arc:
        return {"data": [], "available": False}
    total = len(arc) or 1
    half  = total // 2
    h1, h2 = arc[:half], arc[half:]
    neg1 = sum(1 for a in h1 if a["s"] == "negative")
    neg2 = sum(1 for a in h2 if a["s"] == "negative")
    pos  = sum(1 for a in arc if a["s"] == "positive")
    neu  = sum(1 for a in arc if a["s"] == "neutral")
    neg  = sum(1 for a in arc if a["s"] == "negative")
    if   neg2 < neg1: direction = "warming"
    elif neg2 > neg1: direction = "cooling"
    else:             direction = "consistent"
    return {
        "data":         arc,
        "positive_pct": round(pos / total * 100),
        "neutral_pct":  round(neu / total * 100),
        "negative_pct": round(neg / total * 100),
        "arc_direction": direction,
        "available":    True,
    }

def to_session_dict(label: str, f: dict, m: dict, llm: dict, is_first: bool) -> dict:
    tr = m["talk"]
    nw = m["new_words"]
    ag = m["agency"]
    return {
        "label": label,
        # ── CEFR ──────────────────────────────────────────────────────────────
        "cefr": (llm or {}).get("cefr", {"level": "?", "confidence": "?", "reasoning": ""}),
        # ── 01 Talk ratio ──────────────────────────────────────────────────────
        "talk_ratio": {
            "student_pct":  tr["student_pct"],
            "tutor_pct":    tr["tutor_pct"],
            "student_words": tr["sw_n"],
            "tutor_words":  tr["tw_n"],
            "status":       _talk_status(tr),
        },
        # ── 02 New words ───────────────────────────────────────────────────────
        "new_words": {
            "new_count":   nw["new_n"],
            "total_vocab": nw["total"],
            "sample":      nw["new"][:12],
            "signal":      _words_signal(nw, is_first),
        },
        # ── 03 Top errors (LLM) ────────────────────────────────────────────────
        "top_errors":     (llm or {}).get("top_errors", []),
        # ── 04 Session summary (LLM) ───────────────────────────────────────────
        "session_summary": (llm or {}).get("session_summary", "") or f.get("summary", ""),
        # ── 05 Agency ──────────────────────────────────────────────────────────
        "agency": {
            "score":        ag["score"],
            "pct":          ag["pct"],
            "initiations":  ag["init"],
            "responses":    ag["resp"],
            "intents":      ag["intents"],
            "status":       _agency_status(ag["score"]),
        },
        # ── 06 Active recall ───────────────────────────────────────────────────
        "active_recall": {
            "count":            m["active_recall"]["n"],
            "words":            m["active_recall"]["words"],
            "is_first_session": is_first,
        },
        # ── 07 Self-repairs (LLM) ─────────────────────────────────────────────
        "self_repairs": (llm or {}).get("self_repairs", {}),
        # ── 08 Filler pressure ─────────────────────────────────────────────────
        "filler_pressure": {
            "total":       m["filler_pressure"]["total"],
            "by_topic":    m["filler_pressure"]["by_topic"],
            "worst_topic": m["filler_pressure"]["worst"],
        },
        # ── 09 Code-switching ──────────────────────────────────────────────────
        "code_switching": {
            "count":     m["code_switch"]["n"],
            "instances": m["code_switch"]["inst"],
        },
        # ── 10 Gray zones (LLM) ────────────────────────────────────────────────
        "gray_zones": (llm or {}).get("gray_zones", {}),
        # ── 11 Sentiment arc ───────────────────────────────────────────────────
        "sentiment_arc": _sentiment_block(m["sentiment_arc"]),
        # ── 12 Topic expansion ─────────────────────────────────────────────────
        "topic_expansion": {
            "new_topics":       m["topic_exp"]["new"],
            "recurring_topics": m["topic_exp"]["growing"],
            "all_topics":       m["topic_exp"]["cur"],
        },
    }


def build_progression(labels: list, all_m: list, all_llm: list) -> Optional[dict]:
    if len(all_m) < 2:
        return None
    cefrs = [(llm or {}).get("cefr", {}).get("level", "?") for llm in all_llm]
    a, b  = all_m[0], all_m[-1]
    checks = [
        ("Talk time growing",    b["talk"]["student_pct"]         > a["talk"]["student_pct"]),
        ("Vocabulary expanding", b["new_words"]["total"]           > a["new_words"]["total"]),
        ("Fewer fillers",        b["filler_pressure"]["total"]     < a["filler_pressure"]["total"]),
        ("Agency increasing",    b["agency"]["score"]              > a["agency"]["score"]),
        ("Active recall",        b["active_recall"]["n"]           > 0),
    ]
    good = sum(1 for _, v in checks if v)
    if   good >= 4: verdict = "Clear progression detected."
    elif good >= 2: verdict = "Mixed signals — improvement in some areas."
    else:           verdict = "Plateau or regression. Review tutor strategy."
    return {
        "labels": labels,
        "metrics_table": {
            "talk_time_pct": [m["talk"]["student_pct"] for m in all_m],
            "new_words":     [m["new_words"]["new_n"]  for m in all_m],
            "total_vocab":   [m["new_words"]["total"]  for m in all_m],
            "fillers":       [m["filler_pressure"]["total"] for m in all_m],
            "agency_score":  [m["agency"]["score"]     for m in all_m],
            "active_recall": [m["active_recall"]["n"]  for m in all_m],
            "cefr":          cefrs,
        },
        "signals":        [{"name": n, "positive": ok} for n, ok in checks],
        "positive_count": good,
        "total_signals":  len(checks),
        "verdict":        verdict,
        "cefr_journey":   cefrs,
    }


def run_analysis(mode: str, sources: list, student_id: str = "unknown") -> dict:
    """Run the full pipeline, persist each session to DB, return structured dict."""
    all_f, all_m, all_llm, labels = [], [], [], []
    pv = pt = ptp = None
    for i, src in enumerate(sources):
        label = Path(src).stem
        f, m, llm = run_one(src, mode, pv, pt, ptp)
        all_f.append(f); all_m.append(m); all_llm.append(llm); labels.append(label)
        pv  = set(w["word"].lower() for w in f["sw"] if w["word"].isalpha())
        pt  = set(w["word"].lower() for w in f["tw"] if w["word"].isalpha() and len(w["word"]) > 3)
        ptp = set(f["unique_topics"])
    sessions = [
        to_session_dict(labels[i], all_f[i], all_m[i], all_llm[i], is_first=(i == 0))
        for i in range(len(labels))
    ]
    # Persist each session to DB (no-op if DATABASE_URL not set)
    for i, session in enumerate(sessions):
        db.save_session(
            student_id=student_id,
            label=labels[i],
            source=sources[i],
            result=session,
        )
    return {
        "sessions":    sessions,
        "progression": build_progression(labels, all_m, all_llm),
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/conversations")
def list_conversations():
    """List all available preset conversations (the 'Import' cards in the UI)."""
    return [
        {
            "id":          pid,
            "name":        p["name"],
            "description": p["description"],
            "sessions":    len(p["sources"]),
            "story":       p["story"],
            "badge":       p["badge"],
        }
        for pid, p in PRESETS.items()
    ]


@app.get("/analyze/preset/{preset_id}")
def analyze_preset(preset_id: str, bust_cache: bool = False):
    """
    Run analysis on a preset conversation.
    Results are cached in cache/<preset_id>.json so the frontend stays fast.
    Pass ?bust_cache=true to force a rerun (useful after pipeline changes).
    """
    if preset_id not in PRESETS:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown preset '{preset_id}'. Available: {list(PRESETS.keys())}"
        )
    cache_file = CACHE_DIR / f"{preset_id}.json"
    if cache_file.exists() and not bust_cache:
        return json.loads(cache_file.read_text(encoding="utf-8"))

    preset = PRESETS[preset_id]
    result = run_analysis(preset["mode"], preset["sources"], student_id=preset["student_id"])
    result["preset"] = {
        "id":    preset_id,
        "name":  preset["name"],
        "story": preset["story"],
        "badge": preset["badge"],
    }
    cache_file.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return result


class AnalyzeRequest(BaseModel):
    mode:       str           # "preply" | "json" | "audio"
    sources:    List[str]     # paths relative to project root
    student_id: str = "unknown"

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    """Run analysis on any custom sources (for dev / one-off use)."""
    if req.mode not in ("preply", "json", "audio"):
        raise HTTPException(status_code=400, detail="mode must be preply, json, or audio")
    if not req.sources:
        raise HTTPException(status_code=400, detail="sources list is empty")
    return run_analysis(req.mode, req.sources, student_id=req.student_id)


@app.get("/students/{student_id}/history")
def student_history(student_id: str, limit: int = 20):
    """
    Return past sessions for a student, newest first.
    Each item: { id, label, source, analyzed_at, cefr_level, result }
    """
    rows = db.get_history(student_id, limit=limit)
    return {"student_id": student_id, "sessions": rows}


# ─── Live recording  (placeholder — wired in once recordings exist) ───────────

@app.post("/live/start")
def live_start():
    """
    [PLACEHOLDER]  Will trigger record.py and return a session_id.
    The frontend shows a 'Recording...' state until /live/stop is called.
    """
    return {
        "status":     "not_implemented",
        "session_id": None,
        "message":    "Plug in record.py here when ready.",
    }


@app.post("/live/stop/{session_id}")
def live_stop(session_id: str):
    """
    [PLACEHOLDER]  Stops recording, runs:
      record.py → transcribe_rich.py → run_one(audio) → returns full dashboard
    """
    return {"status": "not_implemented", "session_id": session_id}


@app.get("/live/status/{session_id}")
def live_status(session_id: str):
    """
    [PLACEHOLDER]  SSE stream — will emit progress events:
      recording → transcribing → analyzing → done
    The frontend subscribes to this to show a real-time progress bar.
    """
    def _stream():
        yield 'data: {"step": "not_implemented"}\n\n'
    return StreamingResponse(_stream(), media_type="text/event-stream")
