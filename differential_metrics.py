"""
DIFFERENTIAL METRICS — Preply Hackathon
========================================
The three angles nobody else will bring:

  A) Conversation Power Shift  — who owns the floor, and how it changes
  B) Formulaic Sequence Speed  — "on the other hand" in 0.8s = it's internalized
  C) Zipf Distribution         — vocabulary curve converging toward native speakers

All output is terminal-based (no UI), built on the raw JSON timestamps.
"""

import json
import math
import re
from collections import Counter
from pathlib import Path

import numpy as np
import spacy

nlp = spacy.load("en_core_web_sm")

# ── Formulaic sequences to track ─────────────────────────────────────────────
# Ordered longest first so we match the longest possible sequence
FORMULAIC_SEQUENCES = [
    "on the other hand",
    "as a matter of fact",
    "in other words",
    "to be honest",
    "as a result",
    "i think that",
    "i mean",
    "i think",
    "you know",
    "of course",
    "in fact",
    "at least",
    "as well",
    "kind of",
    "sort of",
    "by the way",
    "at the same time",
    "more or less",
    "to be fair",
    "first of all",
]

# ── Data loading ──────────────────────────────────────────────────────────────

def load_lesson_full(lesson_dir: Path) -> dict:
    """Load all segments and return raw word lists per channel + merged turns."""
    student_words = []
    tutor_words = []
    merged_paragraphs = []   # list of {channel, words, start, end}

    for fpath in sorted(lesson_dir.glob("*.json")):
        with open(fpath, encoding="utf-8") as f:
            data = json.load(f)

        channels = data["results"]["channels"]
        for ch_idx, ch in enumerate(channels):
            alt = ch["alternatives"][0]
            words = alt.get("words", [])
            if ch_idx == 0:
                student_words.extend(words)
            else:
                tutor_words.extend(words)

        # Merged view: paragraphs tagged by channel
        for para in data["results"]["paragraphs"]["paragraphs"]:
            ch = para.get("channel", -1)
            start = para["start"]
            end = para["end"]
            sentences = para.get("sentences", [])
            words_in_para = [
                w for w in (student_words if ch == 0 else tutor_words)
                if start <= w["start"] <= end
            ]
            merged_paragraphs.append({
                "channel": ch,
                "start": start,
                "end": end,
                "sentences": sentences,
                "words": words_in_para,
            })

    # Sort merged by start time
    merged_paragraphs.sort(key=lambda p: p["start"])
    return {
        "student_words": student_words,
        "tutor_words": tutor_words,
        "merged": merged_paragraphs,
    }

# ══════════════════════════════════════════════════════════════════════════════
# A) CONVERSATION POWER SHIFT
# ══════════════════════════════════════════════════════════════════════════════

def conversation_power_shift(lesson_data: dict) -> dict:
    """
    Four dimensions of who owns the conversation:
      1. Talk Time Ratio  — student speaking time / total speaking time
      2. Response Latency — gap (s) between tutor end and student start
      3. Turn Length      — avg words per student turn
      4. Lexical Uptake   — student reusing tutor's NEW words (cross-lesson handled at caller)
    """
    sw = lesson_data["student_words"]
    tw = lesson_data["tutor_words"]
    merged = lesson_data["merged"]

    # Talk time
    def phonation(words):
        return sum(w["end"] - w["start"] for w in words)

    s_time = phonation(sw)
    t_time = phonation(tw)
    total = s_time + t_time
    talk_ratio = s_time / total if total > 0 else 0

    # Response latency: each (tutor_para → student_para) consecutive pair
    latencies = []
    for i in range(len(merged) - 1):
        curr = merged[i]
        nxt  = merged[i + 1]
        if curr["channel"] == 1 and nxt["channel"] == 0:
            gap = nxt["start"] - curr["end"]
            if 0 < gap < 30:   # ignore huge gaps (camera drop, etc.)
                latencies.append(gap)

    avg_latency = float(np.mean(latencies)) if latencies else 0.0
    med_latency = float(np.median(latencies)) if latencies else 0.0

    # Turn length (words per student paragraph)
    student_turns = [p for p in merged if p["channel"] == 0]
    turn_lengths = [len(p["words"]) for p in student_turns if p["words"]]
    avg_turn_len = float(np.mean(turn_lengths)) if turn_lengths else 0.0

    # Intra-lesson lexical uptake:
    # Words the TUTOR uses that the student THEN uses later in the SAME lesson
    tutor_vocab = set(w["word"].lower() for w in tw
                      if len(w["word"]) > 3 and w["word"].isalpha())
    # Student words that appear AFTER the tutor's first use of that word
    tutor_word_first_time = {}
    for w in sorted(tw, key=lambda x: x["start"]):
        wd = w["word"].lower()
        if wd not in tutor_word_first_time:
            tutor_word_first_time[wd] = w["start"]

    uptake_count = 0
    for w in sw:
        wd = w["word"].lower()
        if wd in tutor_word_first_time and w["start"] > tutor_word_first_time[wd]:
            uptake_count += 1

    uptake_rate = uptake_count / len(sw) if sw else 0.0

    return {
        "talk_time_ratio":   round(talk_ratio, 4),
        "student_pct":       round(talk_ratio * 100, 1),
        "tutor_pct":         round((1 - talk_ratio) * 100, 1),
        "avg_response_latency_s": round(avg_latency, 2),
        "med_response_latency_s": round(med_latency, 2),
        "n_responses":       len(latencies),
        "avg_turn_length_words": round(avg_turn_len, 1),
        "n_student_turns":   len(student_turns),
        "lexical_uptake_pct": round(uptake_rate * 100, 2),
    }


# ══════════════════════════════════════════════════════════════════════════════
# B) FORMULAIC SEQUENCE SPEED
# ══════════════════════════════════════════════════════════════════════════════

def find_formulaic_sequences(words: list) -> list:
    """
    Find instances of FORMULAIC_SEQUENCES in the word list.
    Returns list of {sequence, duration_s, start, end, words_per_sec}.
    """
    word_strings = [w["word"].lower() for w in words]
    hits = []

    for fs in FORMULAIC_SEQUENCES:
        fs_tokens = fs.split()
        n = len(fs_tokens)
        for i in range(len(word_strings) - n + 1):
            window = word_strings[i:i + n]
            if window == fs_tokens:
                start = words[i]["start"]
                end   = words[i + n - 1]["end"]
                dur   = end - start
                if dur > 0:
                    hits.append({
                        "sequence": fs,
                        "duration_s": round(dur, 3),
                        "start": round(start, 2),
                        "end": round(end, 2),
                        "words_per_sec": round(n / dur, 2),
                    })
    return hits


def formulaic_speed_analysis(lesson_data: dict) -> dict:
    """
    Per-lesson: find all FS instances in student channel,
    return avg duration per sequence and overall articulation speed.
    """
    sw = lesson_data["student_words"]
    hits = find_formulaic_sequences(sw)

    if not hits:
        return {"total_fs_found": 0, "avg_duration_s": None, "avg_wps": None, "by_sequence": {}}

    by_seq = {}
    for h in hits:
        seq = h["sequence"]
        if seq not in by_seq:
            by_seq[seq] = []
        by_seq[seq].append(h["duration_s"])

    summary = {seq: {"count": len(durs), "avg_duration_s": round(float(np.mean(durs)), 3)}
               for seq, durs in by_seq.items()}

    all_durs = [h["duration_s"] for h in hits]
    all_wps  = [h["words_per_sec"] for h in hits]

    return {
        "total_fs_found": len(hits),
        "unique_sequences": len(by_seq),
        "avg_duration_s": round(float(np.mean(all_durs)), 3),
        "avg_wps": round(float(np.mean(all_wps)), 2),
        "by_sequence": summary,
        "raw_hits": hits,
    }


# ══════════════════════════════════════════════════════════════════════════════
# C) ZIPF DISTRIBUTION (vocabulary curve toward native)
# ══════════════════════════════════════════════════════════════════════════════

def zipf_analysis(words: list) -> dict:
    """
    Fit a Zipf-Mandelbrot distribution to the student's word frequencies.
    Exponent alpha closer to 1.0 = closer to native speaker distribution.
    L2 learners overuse common words -> steeper slope -> alpha > 1.
    """
    tokens = [w["word"].lower() for w in words if w["word"].isalpha()]
    if len(tokens) < 20:
        return {}

    freq = Counter(tokens)
    counts = sorted(freq.values(), reverse=True)
    ranks  = list(range(1, len(counts) + 1))

    # Log-log linear fit: log(freq) = -alpha * log(rank) + C
    log_ranks  = np.log(ranks)
    log_counts = np.log(counts)

    # Simple least squares fit
    A = np.vstack([log_ranks, np.ones(len(log_ranks))]).T
    result = np.linalg.lstsq(A, log_counts, rcond=None)
    alpha, intercept = result[0]
    alpha = -alpha   # we want positive value

    # Vocabulary richness via entropy
    total = sum(counts)
    probs = [c / total for c in counts]
    entropy = -sum(p * math.log2(p) for p in probs if p > 0)

    # Top-N coverage (what % of tokens are covered by top N unique words)
    top10_cov  = sum(counts[:10])  / total * 100
    top50_cov  = sum(counts[:50])  / total * 100

    return {
        "zipf_alpha":          round(float(alpha), 4),
        "shannon_entropy":     round(entropy, 4),
        "vocab_size":          len(freq),
        "total_tokens":        len(tokens),
        "top10_word_coverage": round(top10_cov, 1),
        "top50_word_coverage": round(top50_cov, 1),
    }


# ══════════════════════════════════════════════════════════════════════════════
# MEAN DEPENDENCY DISTANCE (bonus: best single CEFR discriminator in papers)
# ══════════════════════════════════════════════════════════════════════════════

def mean_dependency_distance(transcript_text: str) -> float:
    """
    MDD: average distance between a word and its syntactic head.
    Increases with grammatical complexity. Discriminates ALL CEFR pairs.
    """
    doc = nlp(transcript_text[:50000])  # cap for speed
    distances = []
    for token in doc:
        if token.head != token:  # skip root
            distances.append(abs(token.i - token.head.i))
    return round(float(np.mean(distances)), 4) if distances else 0.0


# ══════════════════════════════════════════════════════════════════════════════
# RUNNER
# ══════════════════════════════════════════════════════════════════════════════

def analyze_student_differential(student_dir: Path) -> dict:
    lesson_dirs = sorted(d for d in student_dir.iterdir() if d.is_dir())
    lessons = []
    for ld in lesson_dirs:
        data = load_lesson_full(ld)
        sw = data["student_words"]
        transcript = " ".join(w["word"] for w in sw)

        power   = conversation_power_shift(data)
        fs      = formulaic_speed_analysis(data)
        zipf    = zipf_analysis(sw)
        mdd     = mean_dependency_distance(transcript)

        lessons.append({
            "lesson":   ld.name,
            "power":    power,
            "formulaic": fs,
            "zipf":     zipf,
            "mdd":      mdd,
        })
    return lessons


def print_separator(char="=", width=70):
    print(char * width)


def print_differential_report(student_name: str, lessons: list):
    print_separator()
    print(f"  {student_name}  —  DIFFERENTIAL METRICS")
    print_separator()

    # ── A) Conversation Power Shift ──────────────────────────────────────────
    print("\n  [A] CONVERSATION POWER SHIFT")
    print(f"  {'Lesson':<12} {'Student%':>9} {'Tutor%':>8} {'Latency(s)':>11} {'TurnLen':>8} {'Uptake%':>8}")
    print("  " + "-" * 58)
    for les in lessons:
        p = les["power"]
        print(f"  {les['lesson']:<12} "
              f"{p['student_pct']:>8.1f}% "
              f"{p['tutor_pct']:>7.1f}% "
              f"{p['avg_response_latency_s']:>10.2f}s "
              f"{p['avg_turn_length_words']:>8.1f} "
              f"{p['lexical_uptake_pct']:>7.2f}%")

    # Show progression arrows
    if len(lessons) >= 2:
        first, last = lessons[0]["power"], lessons[-1]["power"]
        print()
        ratio_delta = last["student_pct"] - first["student_pct"]
        latency_delta = last["avg_response_latency_s"] - first["avg_response_latency_s"]
        turn_delta = last["avg_turn_length_words"] - first["avg_turn_length_words"]
        uptake_delta = last["lexical_uptake_pct"] - first["lexical_uptake_pct"]

        def arrow(val, higher_better=True):
            improving = val > 0 if higher_better else val < 0
            sign = "+" if val >= 0 else ""
            tag = "[GOOD]" if improving else "[WEAK]"
            return f"{sign}{val:.2f}  {tag}"

        print(f"  Talk time shift:     {arrow(ratio_delta, higher_better=True)}")
        print(f"  Response latency:    {arrow(latency_delta, higher_better=False)}")
        print(f"  Turn length:         {arrow(turn_delta, higher_better=True)}")
        print(f"  Lexical uptake:      {arrow(uptake_delta, higher_better=True)}")

    # ── B) Formulaic Sequence Speed ──────────────────────────────────────────
    print("\n  [B] FORMULAIC SEQUENCE ARTICULATION SPEED")
    print(f"  {'Lesson':<12} {'Sequences':>10} {'Avg dur(s)':>11} {'Avg WPS':>8}")
    print("  " + "-" * 45)
    for les in lessons:
        fs = les["formulaic"]
        n    = fs.get("total_fs_found", 0)
        dur  = fs.get("avg_duration_s")
        wps  = fs.get("avg_wps")
        dur_str = f"{dur:.3f}" if dur is not None else "  n/a"
        wps_str = f"{wps:.2f}"  if wps is not None else " n/a"
        print(f"  {les['lesson']:<12} {n:>10} {dur_str:>11} {wps_str:>8}")

    # Show which sequences were found and their speed per lesson
    all_seqs = set()
    for les in lessons:
        all_seqs.update(les["formulaic"].get("by_sequence", {}).keys())

    if all_seqs:
        print()
        print(f"  {'Sequence':<25}", end="")
        for les in lessons:
            print(f"  {les['lesson']:>12}", end="")
        print()
        print("  " + "-" * (25 + 14 * len(lessons)))
        for seq in sorted(all_seqs):
            print(f"  {seq:<25}", end="")
            for les in lessons:
                by_seq = les["formulaic"].get("by_sequence", {})
                if seq in by_seq:
                    val = by_seq[seq]["avg_duration_s"]
                    cnt = by_seq[seq]["count"]
                    cell = f"{val:.2f}s(x{cnt})"
                    print(f"  {cell:>12}", end="")
                else:
                    print(f"  {'---':>12}", end="")
            print()

    # ── C) Zipf Distribution ─────────────────────────────────────────────────
    print("\n  [C] ZIPF / VOCABULARY DISTRIBUTION")
    print(f"  {'Lesson':<12} {'Alpha':>7} {'Entropy':>9} {'VocabSz':>8} {'Top10%':>7} {'MDD':>7}")
    print("  " + "-" * 54)
    for les in lessons:
        z = les["zipf"]
        mdd = les["mdd"]
        if z:
            print(f"  {les['lesson']:<12} "
                  f"{z['zipf_alpha']:>7.4f} "
                  f"{z['shannon_entropy']:>9.4f} "
                  f"{z['vocab_size']:>8} "
                  f"{z['top10_word_coverage']:>6.1f}% "
                  f"{mdd:>7.4f}")
        else:
            print(f"  {les['lesson']:<12}  (insufficient data)")

    if len(lessons) >= 2:
        first_z = lessons[0]["zipf"]
        last_z  = lessons[-1]["zipf"]
        if first_z and last_z:
            alpha_delta = last_z["zipf_alpha"] - first_z["zipf_alpha"]
            entr_delta  = last_z["shannon_entropy"] - first_z["shannon_entropy"]
            mdd_delta   = lessons[-1]["mdd"] - lessons[0]["mdd"]
            print()
            # Alpha closer to 1.0 = native-like; if too high, going toward 1 is good
            alpha_closer = abs(last_z["zipf_alpha"] - 1.0) < abs(first_z["zipf_alpha"] - 1.0)
            print(f"  Zipf alpha toward 1.0:   {'+' if alpha_delta>=0 else ''}{alpha_delta:.4f}  "
                  f"{'[NATIVE-LIKE]' if alpha_closer else '[AWAY from native]'}")
            print(f"  Entropy (vocab richness): {'+' if entr_delta>=0 else ''}{entr_delta:.4f}  "
                  f"{'[GOOD]' if entr_delta > 0 else '[WEAK]'}")
            print(f"  MDD (syntax complexity):  {'+' if mdd_delta>=0 else ''}{mdd_delta:.4f}  "
                  f"{'[GOOD]' if mdd_delta > 0 else '[WEAK]'}")

    print()


# ── entry point ───────────────────────────────────────────────────────────────

BASE = Path(__file__).parent

if __name__ == "__main__":
    all_results = {}

    for student_dir in sorted(BASE.glob("Student-*")):
        name = student_dir.name
        print(f"\nProcessing {name}...")
        lessons = analyze_student_differential(student_dir)
        all_results[name] = lessons
        print_differential_report(name, lessons)

    # ── HEAD-TO-HEAD summary ──────────────────────────────────────────────────
    print_separator("=")
    print("  HEAD-TO-HEAD  —  DIFFERENTIAL IMPROVEMENT")
    print_separator("=")
    print()

    for name, lessons in all_results.items():
        if len(lessons) < 2:
            continue
        fp = lessons[0]["power"]
        lp = lessons[-1]["power"]
        fz = lessons[0]["zipf"]
        lz = lessons[-1]["zipf"]

        signals = []
        if lp["student_pct"] > fp["student_pct"]:
            signals.append("talks MORE")
        if lp["avg_response_latency_s"] < fp["avg_response_latency_s"]:
            signals.append("responds FASTER")
        if lp["avg_turn_length_words"] > fp["avg_turn_length_words"]:
            signals.append("longer turns")
        if lp["lexical_uptake_pct"] > fp["lexical_uptake_pct"]:
            signals.append("absorbs MORE tutor vocab")
        if fz and lz and lz["shannon_entropy"] > fz["shannon_entropy"]:
            signals.append("richer vocabulary distribution")
        if lessons[-1]["mdd"] > lessons[0]["mdd"]:
            signals.append("more complex grammar (MDD up)")

        fs_improving = False
        f0_wps = lessons[0]["formulaic"].get("avg_wps")
        fl_wps = lessons[-1]["formulaic"].get("avg_wps")
        if f0_wps and fl_wps and fl_wps > f0_wps:
            signals.append(f"faster formulaic speech ({f0_wps} -> {fl_wps} WPS)")
            fs_improving = True

        print(f"  {name}:  {len(signals)}/7 improvement signals")
        for s in signals:
            print(f"    + {s}")
        print()

    print_separator("-")
    print("  Native speaker Zipf alpha ~ 1.0 | Lower latency = faster processing")
    print("  Higher WPS in formulaic sequences = internalized, not word-by-word")
    print_separator("-")
