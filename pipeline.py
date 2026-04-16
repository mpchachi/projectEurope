"""
pipeline.py — Pipeline completo de analisis de progresion linguistica.

Uso (sesion unica):
  python pipeline.py --session rich_simple.json --label "Sesion 1"

Uso (comparar progresion entre sesiones):
  python pipeline.py --sessions rich_simple.json rich_complex.json

Uso (dataset Preply):
  python pipeline.py --sessions "Student-1/lesson-1" "Student-1/lesson-3" --preply
"""

import json
import os
import argparse
import math
from pathlib import Path
from collections import Counter
import anthropic

ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
MODEL         = "claude-sonnet-4-6"

STOPWORDS = {"the","a","an","and","or","but","in","on","at","to","for","of","with",
             "is","are","was","were","be","i","you","he","she","it","we","they",
             "my","your","its","this","that","so","just","like","yeah","okay","yes","no"}

FILLER_SET = {"uh","um","like","you know","i mean","sort of","kind of","basically",
              "literally","actually","right","okay","so","hmm","hm"}

# ══════════════════════════════════════════════════════════════════════════════
# DATA LOADING
# ══════════════════════════════════════════════════════════════════════════════

def load_rich_json(path: str) -> dict:
    """Load a single Deepgram rich JSON (from transcribe_rich.py)."""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return data


def load_preply_lesson(lesson_dir: str) -> dict:
    """
    Load a Preply lesson folder (multiple JSON segments, student=ch0, tutor=ch1).
    Returns a synthetic 'rich' structure compatible with the rest of the pipeline.
    """
    lesson_path = Path(lesson_dir)
    student_words, tutor_words, merged_paras = [], [], []

    for fpath in sorted(lesson_path.glob("*.json")):
        with open(fpath, encoding="utf-8") as f:
            seg = json.load(f)
        r = seg.get("results", {})
        channels = r.get("channels", [])
        for ch_idx, ch in enumerate(channels):
            alt = ch["alternatives"][0]
            words = alt.get("words", [])
            if ch_idx == 0:
                student_words.extend(words)
            else:
                tutor_words.extend(words)
        for para in r.get("paragraphs", {}).get("paragraphs", []):
            merged_paras.append(para)

    # Build synthetic utterances from merged paragraphs
    utterances = []
    for para in sorted(merged_paras, key=lambda p: p.get("start", 0)):
        ch = para.get("channel", -1)
        text = " ".join(s.get("text","") for s in para.get("sentences",[]))
        if text.strip():
            utterances.append({
                "start":      para.get("start", 0),
                "end":        para.get("end", 0),
                "transcript": text,
                "speaker":    0 if ch == 0 else 1,
                "sentiment":  "neutral",
                "sentiment_score": 0.0,
            })

    student_transcript = " ".join(w["word"] for w in student_words)
    tutor_transcript   = " ".join(w["word"] for w in tutor_words)

    return {
        "_source": "preply",
        "_student_words": student_words,
        "_tutor_words":   tutor_words,
        "_student_transcript": student_transcript,
        "_tutor_transcript":   tutor_transcript,
        "results": {
            "utterances": utterances,
            "summaries":  [],
            "sentiments": {"segments": []},
            "topics":     {"segments": []},
        }
    }


def extract_fields(data: dict) -> dict:
    """Unified field extraction from either source type."""
    r = data.get("results", {})

    # --- Utterances (have start/end timestamps + sentiment) ---
    utterances = r.get("utterances", [])

    # --- Words ---
    if data.get("_source") == "preply":
        student_words      = data["_student_words"]
        tutor_words        = data["_tutor_words"]
        student_transcript = data["_student_transcript"]
        tutor_transcript   = data["_tutor_transcript"]
        all_words          = student_words  # for index mapping
    else:
        channels  = r.get("channels", [])
        all_words = channels[0]["alternatives"][0].get("words", []) if channels else []
        student_words = [w for w in all_words if w.get("speaker", 0) == 0]
        tutor_words   = [w for w in all_words if w.get("speaker", 0) == 1]
        if not tutor_words:
            student_words = all_words
            tutor_words   = []
        student_transcript = " ".join(w["word"] for w in student_words)
        tutor_transcript   = " ".join(w["word"] for w in tutor_words)

    # --- Topics: use start_word/end_word indices to get timestamps ---
    topics_segs = r.get("topics", {}).get("segments", [])
    all_topics  = []
    for seg in topics_segs:
        sw = seg.get("start_word", 0)
        ew = seg.get("end_word", sw)
        # Map word indices to timestamps
        t_start = all_words[sw]["start"] if sw < len(all_words) else 0
        t_end   = all_words[min(ew, len(all_words)-1)]["end"] if all_words else 0
        for t in seg.get("topics", []):
            all_topics.append({
                "topic": t.get("topic", ""),
                "start": t_start,
                "end":   t_end,
                "text":  seg.get("text", ""),
            })

    # --- Intents: same word-index mapping ---
    intent_segs = r.get("intents", {}).get("segments", [])
    all_intents = []
    for seg in intent_segs:
        sw = seg.get("start_word", 0)
        ew = seg.get("end_word", sw)
        t_start = all_words[sw]["start"] if sw < len(all_words) else 0
        t_end   = all_words[min(ew, len(all_words)-1)]["end"] if all_words else 0
        for intent in seg.get("intents", []):
            all_intents.append({
                "intent": intent.get("intent", ""),
                "start":  t_start,
                "end":    t_end,
            })

    # --- Summary ---
    summaries    = r.get("summaries", [])
    auto_summary = summaries[0].get("summary", "") if summaries else ""

    # --- Fillers: scan student utterances, attach topic by timestamp ---
    filler_instances = []
    for u in utterances:
        if u.get("speaker", 0) != 0:
            continue
        txt   = u.get("transcript", "").lower()
        u_mid = (u.get("start", 0) + u.get("end", 0)) / 2
        for fw in FILLER_SET:
            if fw in txt.split() or f" {fw} " in f" {txt} ":
                topic_at_time = None
                for t in all_topics:
                    if t["start"] <= u_mid <= t["end"]:
                        topic_at_time = t["topic"]
                        break
                filler_instances.append({
                    "filler":        fw,
                    "start":         u.get("start", 0),
                    "end":           u.get("end", 0),
                    "topic_at_time": topic_at_time,
                })

    return {
        "utterances":          utterances,
        "student_words":       student_words,
        "tutor_words":         tutor_words,
        "student_transcript":  student_transcript,
        "tutor_transcript":    tutor_transcript,
        "topics":              all_topics,
        "unique_topics":       list(set(t["topic"] for t in all_topics)),
        "intents":             all_intents,
        "auto_summary":        auto_summary,
        "filler_instances":    filler_instances,
    }


# ══════════════════════════════════════════════════════════════════════════════
# BASE METRICS (no LLM)
# ══════════════════════════════════════════════════════════════════════════════

def talk_ratio(fields: dict) -> dict:
    sw = fields["student_words"]
    tw = fields["tutor_words"]
    s_dur = sum(w["end"] - w["start"] for w in sw)
    t_dur = sum(w["end"] - w["start"] for w in tw)
    total = s_dur + t_dur
    ratio = s_dur / total if total > 0 else 0.5
    return {
        "student_pct": round(ratio * 100, 1),
        "tutor_pct":   round((1 - ratio) * 100, 1),
        "student_words_count": len(sw),
        "tutor_words_count":   len(tw),
    }


def new_words_today(fields: dict, prev_vocab: set = None) -> dict:
    sw = fields["student_words"]
    vocab = set(w["word"].lower() for w in sw
                if w["word"].isalpha() and w["word"].lower() not in STOPWORDS)
    if prev_vocab is None:
        return {"new_words": list(vocab)[:20], "new_count": len(vocab), "total_vocab": len(vocab)}
    new = vocab - prev_vocab
    return {
        "new_words":   sorted(new)[:20],
        "new_count":   len(new),
        "total_vocab": len(vocab),
    }


def filler_pressure(fields: dict) -> dict:
    fi = fields["filler_instances"]
    total = len(fi)
    by_topic = {}
    for f in fi:
        t = f.get("topic_at_time") or "unknown"
        by_topic[t] = by_topic.get(t, 0) + 1
    worst_topic = max(by_topic, key=by_topic.get) if by_topic else None
    return {
        "total_fillers": total,
        "by_topic":      dict(sorted(by_topic.items(), key=lambda x: -x[1])),
        "worst_topic":   worst_topic,
        "worst_count":   by_topic.get(worst_topic, 0) if worst_topic else 0,
    }


def sentiment_arc(fields: dict) -> list:
    """Returns list of (time_s, sentiment, score) for the student's utterances."""
    arc = []
    for u in fields["utterances"]:
        if u.get("speaker", 0) != 0:
            continue
        arc.append({
            "time":      round(u.get("start", 0), 1),
            "sentiment": u.get("sentiment", "neutral"),
            "score":     round(u.get("sentiment_score", 0.0), 3),
        })
    return arc


def code_switching(fields: dict) -> dict:
    """Detect non-English utterances from the student."""
    switches = []
    for u in fields["utterances"]:
        if u.get("speaker", 0) != 0:
            continue
        lang = u.get("detected_language", "en")
        if lang and lang != "en":
            switches.append({
                "time":  round(u.get("start", 0), 1),
                "text":  u.get("transcript", ""),
                "lang":  lang,
            })
    return {"count": len(switches), "instances": switches}


def topic_expansion(fields: dict, prev_topics: set = None) -> dict:
    current = set(fields["unique_topics"])
    if prev_topics is None:
        return {"current_topics": list(current), "new_topics": list(current), "new_count": len(current)}
    new = current - prev_topics
    return {
        "current_topics": list(current),
        "new_topics":     list(new),
        "new_count":      len(new),
    }


def conversational_agency(fields: dict) -> dict:
    """
    Agency from two signals:
      1. Deepgram intents: count student intents that are statements/opinions vs filler responses
      2. Timing: student turns starting after >2s silence from tutor = self-initiation
    """
    utterances = sorted(fields["utterances"], key=lambda u: u.get("start", 0))
    intents    = fields.get("intents", [])

    # Intent-based: unique intents = the student had something to say
    intent_texts = [i["intent"] for i in intents]
    unique_intents = list(set(intent_texts))

    # Timing-based
    initiations, responses = 0, 0
    for i, u in enumerate(utterances):
        if u.get("speaker", 0) != 0:
            continue
        if i == 0:
            initiations += 1
            continue
        prev = utterances[i - 1]
        gap  = u.get("start", 0) - prev.get("end", 0)
        if gap > 2.0:
            initiations += 1
        else:
            responses += 1

    total = initiations + responses
    base_score = (initiations / total * 10) if total > 0 else 0
    # Bonus for diverse intents
    intent_bonus = min(len(unique_intents) * 0.5, 3.0)
    final_score  = min(round(base_score + intent_bonus, 1), 10.0)

    return {
        "initiations":    initiations,
        "responses":      responses,
        "unique_intents": unique_intents[:6],
        "agency_score":   final_score,
    }


def active_recall(fields: dict, prev_tutor_vocab: set = None) -> dict:
    """Words the tutor introduced in previous sessions that student uses today."""
    if prev_tutor_vocab is None:
        return {"recalled_words": [], "recall_count": 0}
    sw_vocab = set(w["word"].lower() for w in fields["student_words"]
                   if w["word"].isalpha() and w["word"].lower() not in STOPWORDS)
    recalled = sw_vocab & prev_tutor_vocab
    return {
        "recalled_words": sorted(recalled)[:15],
        "recall_count":   len(recalled),
    }


# ══════════════════════════════════════════════════════════════════════════════
# LLM METRICS (Claude)
# ══════════════════════════════════════════════════════════════════════════════

def llm_deep_analysis(fields: dict) -> dict:
    """Ask Claude for: top 3 errors, self-repair rate, gray zones."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

    transcript = fields["student_transcript"]
    if not transcript.strip():
        return {}

    prompt = f"""You are an expert SLA researcher analyzing a student's spoken English transcript.

STUDENT TRANSCRIPT:
{transcript[:3000]}

Give me exactly THREE analyses. Respond ONLY with valid JSON, no other text.

{{
  "top_errors": [
    {{"error": "exact quote with error", "correction": "corrected version", "type": "grammar/vocab/pronunciation"}},
    {{"error": "...", "correction": "...", "type": "..."}},
    {{"error": "...", "correction": "...", "type": "..."}}
  ],
  "self_repairs": {{
    "count": <integer>,
    "examples": ["quote of self-repair instance", "another example"],
    "verdict": "one sentence on what this reveals about metacognitive awareness"
  }},
  "gray_zones": {{
    "structures_never_used": ["grammatical structure 1", "structure 2", "structure 3"],
    "evidence_of_avoidance": ["exact quote showing avoidance", "another quote"],
    "verdict": "one sentence on what this means for their CEFR level"
  }}
}}"""

    resp = client.messages.create(
        model=MODEL,
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )
    raw = resp.content[0].text
    try:
        start = raw.find("{")
        end   = raw.rfind("}") + 1
        return json.loads(raw[start:end])
    except Exception:
        return {"raw": raw}


# ══════════════════════════════════════════════════════════════════════════════
# TERMINAL REPORT
# ══════════════════════════════════════════════════════════════════════════════

W = 68

def bar(value, max_val=100, width=30, char="#"):
    filled = int(width * value / max_val) if max_val > 0 else 0
    return char * filled + "-" * (width - filled)

def section(title):
    print(f"\n  [{title}]")
    print("  " + "-" * (W - 4))

def print_report(label: str, fields: dict, base: dict, llm: dict,
                 prev_vocab: set = None, prev_tutor_vocab: set = None,
                 prev_topics: set = None):

    print("\n" + "=" * W)
    print(f"  LANGUAGE PROGRESS REPORT  —  {label}")
    print("=" * W)

    # ── BASE METRICS ──────────────────────────────────────────────────────────
    section("TALK RATIO")
    tr = base["talk_ratio"]
    print(f"  Student  {bar(tr['student_pct']):<32} {tr['student_pct']}%")
    print(f"  Tutor    {bar(tr['tutor_pct']):<32} {tr['tutor_pct']}%")
    print(f"  ({tr['student_words_count']} student words, {tr['tutor_words_count']} tutor words)")

    section("NEW WORDS TODAY")
    nw = base["new_words"]
    print(f"  {nw['new_count']} new words out of {nw['total_vocab']} total vocab")
    if nw["new_words"]:
        print(f"  Sample: {', '.join(nw['new_words'][:10])}")

    section("SESSION SUMMARY")
    summary = fields["auto_summary"]
    if summary:
        print(f"  {summary[:200]}")
    else:
        topics = fields["unique_topics"]
        print(f"  Topics covered: {', '.join(topics[:6]) if topics else 'N/A'}")

    # ── DIFFERENTIAL METRICS ─────────────────────────────────────────────────
    section("FILLER PRESSURE  (where fillers cluster)")
    fp = base["filler_pressure"]
    print(f"  Total fillers: {fp['total_fillers']}")
    if fp["by_topic"]:
        for topic, count in list(fp["by_topic"].items())[:4]:
            b = bar(count, max_val=max(fp["by_topic"].values()), width=20)
            print(f"  {topic[:28]:<28} {b} {count}")
        if fp["worst_topic"]:
            print(f"\n  >> Blockage detected: '{fp['worst_topic']}' ({fp['worst_count']} fillers)")

    section("SENTIMENT ARC")
    arc = base["sentiment_arc"]
    if arc:
        # Show timeline as ASCII spark
        labels = {"positive": "+", "neutral": "~", "negative": "-"}
        spark = "".join(labels.get(a["sentiment"], "?") for a in arc)
        print(f"  Timeline: [{spark}]")
        pos = sum(1 for a in arc if a["sentiment"] == "positive")
        neg = sum(1 for a in arc if a["sentiment"] == "negative")
        neu = sum(1 for a in arc if a["sentiment"] == "neutral")
        print(f"  Positive: {pos}  Neutral: {neu}  Negative: {neg}")
        # Trend
        first_half = arc[:len(arc)//2]
        second_half = arc[len(arc)//2:]
        neg_first  = sum(1 for a in first_half  if a["sentiment"] == "negative")
        neg_second = sum(1 for a in second_half if a["sentiment"] == "negative")
        if neg_second < neg_first:
            print("  Trend: started tense, gained confidence as session progressed")
        elif neg_second > neg_first:
            print("  Trend: started confident, pressure increased toward end")
        else:
            print("  Trend: consistent emotional state throughout")
    else:
        print("  (no sentiment data — enable in Deepgram options)")

    section("CONVERSATIONAL AGENCY")
    ca = base["agency"]
    print(f"  Initiations: {ca['initiations']}  |  Responses: {ca['responses']}")
    score_bar = bar(ca["agency_score"], max_val=10, width=30)
    print(f"  Agency Score: [{score_bar}] {ca['agency_score']}/10")
    if ca.get("unique_intents"):
        print(f"  Intents detected: {', '.join(ca['unique_intents'][:4])}")

    section("CODE-SWITCHING")
    cs = base["code_switch"]
    if cs["count"] == 0:
        print("  No code-switching detected. Stayed in English throughout.")
    else:
        print(f"  Fell back to native language {cs['count']} times:")
        for inst in cs["instances"][:3]:
            print(f"    {inst['time']}s [{inst['lang']}]: \"{inst['text'][:60]}\"")

    if prev_tutor_vocab is not None:
        section("ACTIVE RECALL  (tutor vocab from prev. session used today)")
        ar = base["active_recall"]
        print(f"  Recalled {ar['recall_count']} words introduced by tutor last session")
        if ar["recalled_words"]:
            print(f"  Words: {', '.join(ar['recalled_words'][:10])}")

    if prev_topics is not None:
        section("TOPIC EXPANSION")
        te = base["topic_expansion"]
        print(f"  New topics this session: {te['new_count']}")
        if te["new_topics"]:
            print(f"  Unlocked: {', '.join(te['new_topics'])}")

    # ── LLM METRICS ───────────────────────────────────────────────────────────
    if llm and "raw" not in llm:
        section("TOP 3 ERRORS  (with corrections)")
        for i, e in enumerate(llm.get("top_errors", [])[:3], 1):
            print(f"  {i}. [{e.get('type','').upper()}]")
            print(f"     Said:    \"{e.get('error','')}\"")
            print(f"     Better:  \"{e.get('correction','')}\"")

        section("SELF-REPAIR  (metacognitive awareness)")
        sr = llm.get("self_repairs", {})
        print(f"  Count: {sr.get('count', 0)}")
        if sr.get("examples"):
            for ex in sr["examples"][:2]:
                print(f"  Example: \"{ex}\"")
        print(f"  Verdict: {sr.get('verdict','')}")

        section("GRAY ZONES  (structures you never attempt)")
        gz = llm.get("gray_zones", {})
        structs = gz.get("structures_never_used", [])
        for s in structs[:3]:
            print(f"  - {s}")
        if gz.get("evidence_of_avoidance"):
            print(f"  Evidence: \"{gz['evidence_of_avoidance'][0][:80]}\"")
        print(f"  Verdict: {gz.get('verdict','')}")

    print("\n" + "=" * W + "\n")


# ══════════════════════════════════════════════════════════════════════════════
# PROGRESSION COMPARISON
# ══════════════════════════════════════════════════════════════════════════════

def print_progression(labels, all_base, all_llm):
    print("\n" + "=" * W)
    print("  PROGRESSION ACROSS SESSIONS")
    print("=" * W)

    print(f"\n  {'Metric':<32}", end="")
    for l in labels:
        print(f"  {l[:12]:>12}", end="")
    print()
    print("  " + "-" * (32 + 14 * len(labels)))

    rows = [
        ("Talk time %",      [b["talk_ratio"]["student_pct"] for b in all_base]),
        ("New words",        [b["new_words"]["new_count"]    for b in all_base]),
        ("Fillers",          [b["filler_pressure"]["total_fillers"] for b in all_base]),
        ("Agency score",     [b["agency"]["agency_score"]    for b in all_base]),
    ]

    for name, vals in rows:
        print(f"  {name:<32}", end="")
        for v in vals:
            print(f"  {str(v):>12}", end="")
        print()

    # Trend arrows
    if len(all_base) >= 2:
        print(f"\n  Progression signals (first -> last):")
        first, last = all_base[0], all_base[-1]
        checks = [
            ("Talk time",   last["talk_ratio"]["student_pct"] > first["talk_ratio"]["student_pct"],    True),
            ("Fillers",     last["filler_pressure"]["total_fillers"] < first["filler_pressure"]["total_fillers"], True),
            ("Agency",      last["agency"]["agency_score"] > first["agency"]["agency_score"],           True),
        ]
        for name, improving, _ in checks:
            mark = "[GOOD]" if improving else "[WEAK]"
            print(f"    {name:<20} {mark}")

    print()


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

def run_session(path: str, preply_mode: bool,
                prev_vocab: set = None, prev_tutor_vocab: set = None,
                prev_topics: set = None) -> tuple:

    if preply_mode:
        data = load_preply_lesson(path)
    else:
        data = load_rich_json(path)

    fields = extract_fields(data)

    # Base metrics (fast, no LLM)
    base = {
        "talk_ratio":     talk_ratio(fields),
        "new_words":      new_words_today(fields, prev_vocab),
        "filler_pressure":filler_pressure(fields),
        "sentiment_arc":  sentiment_arc(fields),
        "agency":         conversational_agency(fields),
        "code_switch":    code_switching(fields),
        "active_recall":  active_recall(fields, prev_tutor_vocab),
        "topic_expansion":topic_expansion(fields, prev_topics),
    }

    # LLM metrics (Claude)
    print("  Calling Claude for deep analysis...")
    llm = llm_deep_analysis(fields)

    return fields, base, llm


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--session",  help="Single rich JSON file")
    parser.add_argument("--sessions", nargs="+", help="Multiple sessions (shows progression)")
    parser.add_argument("--label",    default="Session", help="Label")
    parser.add_argument("--preply",   action="store_true", help="Input is Preply lesson folder")
    args = parser.parse_args()

    if args.session:
        path = args.session
        print(f"\nProcessing {path}...")
        fields, base, llm = run_session(path, preply_mode=args.preply)
        print_report(args.label, fields, base, llm)

    elif args.sessions:
        all_fields, all_base, all_llm, labels = [], [], [], []
        prev_vocab, prev_tutor_vocab, prev_topics = None, None, None

        for i, path in enumerate(args.sessions):
            label = path.replace(".json","").replace("rich_","").replace("/","_")
            print(f"\nProcessing session {i+1}: {path}...")
            fields, base, llm = run_session(
                path, preply_mode=args.preply,
                prev_vocab=prev_vocab,
                prev_tutor_vocab=prev_tutor_vocab,
                prev_topics=prev_topics,
            )
            print_report(label, fields, base, llm,
                         prev_vocab=prev_vocab,
                         prev_tutor_vocab=prev_tutor_vocab,
                         prev_topics=prev_topics)

            all_fields.append(fields)
            all_base.append(base)
            all_llm.append(llm)
            labels.append(label)

            # Update cross-session state
            prev_vocab = set(w["word"].lower() for w in fields["student_words"]
                             if w["word"].isalpha())
            prev_tutor_vocab = set(w["word"].lower() for w in fields["tutor_words"]
                                   if w["word"].isalpha() and len(w["word"]) > 3)
            prev_topics = set(fields["unique_topics"])

        if len(args.sessions) >= 2:
            print_progression(labels, all_base, all_llm)

    else:
        parser.print_help()
