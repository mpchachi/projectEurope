"""
Preply Hackathon - Language Proficiency Progression Analysis
Analyzes lesson transcripts to measure student improvement over time.

Metrics computed per lesson (student channel only):
  1. Speech Rate (WPM)        - words per minute of actual speaking time
  2. Articulation Rate        - words per second (no pauses)
  3. Lexical Diversity (TTR)  - unique words / total words
  4. Disfluency Rate          - repeated/stuttered words / total words
  5. Avg Sentence Length      - mean words per sentence (syntactic complexity)
  6. Pause Rate               - pauses > 0.5s per 100 words
  7. Avg Word Confidence      - ASR confidence (proxy for pronunciation clarity)
  8. Long-Word Ratio          - words >= 7 chars / total (vocabulary sophistication)
"""

import json
import os
import re
from pathlib import Path
from collections import Counter
import math

# ── helpers ──────────────────────────────────────────────────────────────────

STOPWORDS = {
    "the","a","an","and","or","but","in","on","at","to","for","of","with",
    "is","are","was","were","be","been","being","have","has","had","do",
    "does","did","will","would","could","should","may","might","shall",
    "i","you","he","she","it","we","they","me","him","her","us","them",
    "my","your","his","its","our","their","this","that","these","those",
    "yes","no","yeah","okay","ok","so","just","like","uh","um","hm","hmm",
}


def load_lesson(lesson_dir: Path) -> dict:
    """Load and merge all JSON segments for one lesson."""
    student_words = []    # channel 0 words
    student_sentences = []  # channel 0 sentences (from paragraphs)
    tutor_words = []      # channel 1 words

    files = sorted(lesson_dir.glob("*.json"))
    for fpath in files:
        with open(fpath, encoding="utf-8") as f:
            data = json.load(f)

        channels = data["results"]["channels"]

        # channel 0 = student, channel 1 = tutor
        for ch_idx, ch_data in enumerate(channels):
            alt = ch_data["alternatives"][0]
            words = alt.get("words", [])
            if ch_idx == 0:
                student_words.extend(words)
                # collect sentences from paragraphs
                paras = alt.get("paragraphs", {}).get("paragraphs", [])
                for para in paras:
                    for sent in para.get("sentences", []):
                        student_sentences.append(sent)
            else:
                tutor_words.extend(words)

    return {
        "student_words": student_words,
        "student_sentences": student_sentences,
        "tutor_words": tutor_words,
    }


def detect_disfluencies(words: list) -> int:
    """Count consecutive word repetitions (stutters / false starts)."""
    count = 0
    for i in range(1, len(words)):
        if words[i]["word"].lower() == words[i - 1]["word"].lower():
            count += 1
    return count


def compute_pauses(words: list, threshold: float = 0.5) -> int:
    """Count gaps > threshold seconds between consecutive words."""
    count = 0
    for i in range(1, len(words)):
        gap = words[i]["start"] - words[i - 1]["end"]
        if gap > threshold:
            count += 1
    return count


def speaking_duration(words: list) -> float:
    """Total duration of actual phonation (sum of word durations)."""
    return sum(w["end"] - w["start"] for w in words)


def wall_clock_span(words: list) -> float:
    """Wall-clock time from first word start to last word end."""
    if not words:
        return 0.0
    return words[-1]["end"] - words[0]["start"]


def lexical_diversity(words: list) -> float:
    """Type-Token Ratio on content words (filter stopwords & short words)."""
    tokens = [w["word"].lower() for w in words
              if w["word"].lower() not in STOPWORDS and len(w["word"]) > 2]
    if not tokens:
        return 0.0
    return len(set(tokens)) / len(tokens)


def content_word_count(words: list) -> int:
    return sum(1 for w in words
               if w["word"].lower() not in STOPWORDS and len(w["word"]) > 2)


def long_word_ratio(words: list, min_len: int = 7) -> float:
    """Fraction of words with >= min_len chars (vocabulary sophistication)."""
    clean = [w["word"].lower() for w in words
             if re.match(r"[a-z]+", w["word"].lower())]
    if not clean:
        return 0.0
    return sum(1 for w in clean if len(w) >= min_len) / len(clean)


def avg_sentence_length(sentences: list) -> float:
    """Mean words per student sentence."""
    lens = []
    for s in sentences:
        text = s.get("text", "")
        word_count = len(text.split())
        if word_count > 0:
            lens.append(word_count)
    return sum(lens) / len(lens) if lens else 0.0


def avg_confidence(words: list) -> float:
    if not words:
        return 0.0
    return sum(w["confidence"] for w in words) / len(words)


# ── main computation ──────────────────────────────────────────────────────────

def analyze_lesson(lesson_dir: Path) -> dict:
    data = load_lesson(lesson_dir)
    sw = data["student_words"]
    ss = data["student_sentences"]

    if not sw:
        return {}

    total_words = len(sw)
    speak_dur = speaking_duration(sw)       # phonation time in seconds
    span = wall_clock_span(sw)              # total span in seconds

    wpm = (total_words / speak_dur * 60) if speak_dur > 0 else 0
    arts = (total_words / span * 60) if span > 0 else 0   # words per minute incl pauses

    disfl = detect_disfluencies(sw)
    disfl_rate = disfl / total_words if total_words else 0

    pauses = compute_pauses(sw, threshold=0.5)
    pause_rate = pauses / total_words * 100 if total_words else 0

    ttr = lexical_diversity(sw)
    lwr = long_word_ratio(sw)
    asl = avg_sentence_length(ss)
    conf = avg_confidence(sw)
    cw = content_word_count(sw)

    return {
        "total_words": total_words,
        "content_words": cw,
        "speech_rate_wpm": round(wpm, 1),
        "overall_rate_wpm": round(arts, 1),
        "disfluency_rate_pct": round(disfl_rate * 100, 2),
        "pause_rate_per100": round(pause_rate, 2),
        "lexical_diversity_ttr": round(ttr, 4),
        "long_word_ratio_pct": round(lwr * 100, 2),
        "avg_sentence_length": round(asl, 2),
        "avg_word_confidence": round(conf, 4),
    }


def compute_progress_score(lessons: list[dict]) -> dict:
    """
    Compute a composite Progress Score comparing first vs last lesson.
    Each metric is normalised to a direction (higher = better).
    Returns per-metric delta and overall weighted score.
    """
    if len(lessons) < 2:
        return {}

    first, last = lessons[0], lessons[-1]

    # (metric_key, weight, higher_is_better)
    metrics = [
        ("speech_rate_wpm",        0.20, True),
        ("lexical_diversity_ttr",  0.25, True),
        ("disfluency_rate_pct",    0.20, False),
        ("avg_sentence_length",    0.15, True),
        ("long_word_ratio_pct",    0.10, True),
        ("avg_word_confidence",    0.10, True),
    ]

    deltas = {}
    weighted_sum = 0.0

    for key, weight, higher_better in metrics:
        v_first = first.get(key, 0)
        v_last  = last.get(key, 0)
        if v_first == 0:
            delta_pct = 0.0
        else:
            delta_pct = (v_last - v_first) / v_first * 100
        signed = delta_pct if higher_better else -delta_pct
        weighted_sum += signed * weight
        deltas[key] = round(delta_pct, 2)

    return {"per_metric_delta_pct": deltas, "composite_score": round(weighted_sum, 2)}


# ── runner ────────────────────────────────────────────────────────────────────

def analyze_student(student_dir: Path) -> dict:
    lesson_dirs = sorted(d for d in student_dir.iterdir() if d.is_dir())
    lessons = []
    for ld in lesson_dirs:
        metrics = analyze_lesson(ld)
        metrics["lesson"] = ld.name
        lessons.append(metrics)
    progress = compute_progress_score(lessons)
    return {"lessons": lessons, "progress": progress}


def print_report(student_name: str, result: dict):
    print(f"\n{'='*60}")
    print(f"  {student_name}")
    print(f"{'='*60}")

    lessons = result["lessons"]
    headers = [
        ("Lesson", 10),
        ("WPM(speech)", 12),
        ("Disfl%", 8),
        ("TTR", 7),
        ("Avg SentLen", 11),
        ("LongWord%", 10),
        ("Confidence", 11),
    ]
    header_line = "".join(h.ljust(w) for h, w in headers)
    print(header_line)
    print("-" * 70)
    for les in lessons:
        row = [
            les.get("lesson",""),
            str(les.get("speech_rate_wpm","")),
            str(les.get("disfluency_rate_pct","")),
            str(les.get("lexical_diversity_ttr","")),
            str(les.get("avg_sentence_length","")),
            str(les.get("long_word_ratio_pct","")),
            str(les.get("avg_word_confidence","")),
        ]
        print("".join(v.ljust(w) for v, (_, w) in zip(row, headers)))

    prog = result["progress"]
    if prog:
        print(f"\n--- Progress (first -> last lesson) ---")
        for key, delta in prog["per_metric_delta_pct"].items():
            arrow = "^" if delta >= 0 else "v"
            print(f"  {key:<35} {arrow} {abs(delta):>6.2f}%")
        score = prog["composite_score"]
        verdict = "IMPROVING" if score > 0 else "DECLINING"
        print(f"\n  Composite Progress Score: {score:+.2f}  =>  {verdict}")


# ── entry point ───────────────────────────────────────────────────────────────

BASE = Path(__file__).parent

if __name__ == "__main__":
    results = {}
    for student_dir in sorted(BASE.glob("Student-*")):
        name = student_dir.name
        results[name] = analyze_student(student_dir)
        print_report(name, results[name])

    # Final comparison
    print(f"\n{'='*60}")
    print("  FINAL COMPARISON")
    print(f"{'='*60}")
    for name, res in results.items():
        score = res["progress"].get("composite_score", "N/A")
        print(f"  {name}: Composite Score = {score:+.2f}")

    scores = {n: r["progress"].get("composite_score", -999) for n, r in results.items()}
    winner = max(scores, key=scores.get)
    print(f"\n  >> {winner} shows the most improvement <<")
