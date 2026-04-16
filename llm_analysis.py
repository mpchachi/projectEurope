"""
llm_analysis.py — Claude razona sobre los JSONs ricos de Deepgram.

Extrae tres cosas que no se pueden contar:
  1. Avoidance Detection   — estructuras que el contexto pedia y el hablante evito
  2. Functional Adequacy  — si las respuestas cumplen el objetivo comunicativo
  3. Linguistic Risk Index — si el hablante tomo riesgos o jugo sobre seguro

Uso:
  python llm_analysis.py --file rich_simple.json  --label "Speaker Simple"
  python llm_analysis.py --file rich_complex.json --label "Speaker Complex"
  python llm_analysis.py --compare rich_simple.json rich_complex.json
"""

import json
import os
import argparse
import anthropic

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
MODEL = "claude-sonnet-4-6"


def load_transcript(json_path: str) -> dict:
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    r = data.get("results", {})
    channels = r.get("channels", [])
    words = channels[0]["alternatives"][0].get("words", []) if channels else []
    utterances = r.get("utterances", [])
    sentiments = r.get("sentiments", {}).get("segments", [])
    topics_segs = r.get("topics", {}).get("segments", [])
    summaries = r.get("summaries", [])

    full_transcript = " ".join(w["word"] for w in words)

    # Utterances con timestamps y sentiment
    utterance_details = []
    for u in utterances:
        utterance_details.append({
            "start": round(u.get("start", 0), 2),
            "end":   round(u.get("end", 0), 2),
            "text":  u.get("transcript", ""),
            "sentiment": u.get("sentiment", "neutral"),
            "sentiment_score": round(u.get("sentiment_score", 0), 3),
        })

    # Topics detectados
    all_topics = []
    for seg in topics_segs:
        for t in seg.get("topics", []):
            all_topics.append(t.get("topic", ""))

    # Resumen automatico
    auto_summary = summaries[0].get("summary", "") if summaries else ""

    # Palabras con confidence bajo (< 0.75)
    low_conf = [w["word"] for w in words if w.get("confidence", 1) < 0.75]

    # Filler words
    fillers = [w["word"] for w in words
               if w["word"].lower() in {"uh","um","like","you know","i mean","sort of","kind of"}]

    return {
        "transcript": full_transcript,
        "utterances": utterance_details,
        "topics": list(set(all_topics)),
        "auto_summary": auto_summary,
        "word_count": len(words),
        "low_confidence_words": low_conf[:20],
        "filler_count": len(fillers),
        "filler_words": fillers[:15],
        "sentiment_distribution": {
            seg.get("sentiment","neutral"): 0
            for seg in sentiments
        },
    }


def analyze_with_claude(transcript_data: dict, label: str) -> dict:
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    utterances_text = "\n".join(
        f"  [{u['start']}s-{u['end']}s | {u['sentiment']}] {u['text']}"
        for u in transcript_data["utterances"]
    )

    prompt = f"""You are an expert SLA (Second Language Acquisition) researcher analyzing a speech transcript.

TRANSCRIPT ({label}):
{transcript_data['transcript']}

UTTERANCES WITH TIMING AND SENTIMENT:
{utterances_text}

TOPICS DETECTED BY ASR: {transcript_data['topics']}
AUTO-SUMMARY: {transcript_data['auto_summary']}
FILLER WORDS USED ({transcript_data['filler_count']} total): {transcript_data['filler_words']}
LOW-CONFIDENCE WORDS (possible mispronunciation): {transcript_data['low_confidence_words']}

Analyze this transcript for THREE specific constructs from SLA research. Be precise and cite exact quotes.

---

1. AVOIDANCE DETECTION
Based on the topics and content, identify 2-3 specific grammatical structures or vocabulary domains that the conversational context INVITED but the speaker AVOIDED.
- What structure was contextually expected?
- What did the speaker do instead? (Quote exact text)
- Is this systematic avoidance or just one instance?
- CEFR implication: what does this avoidance suggest about their level?

2. FUNCTIONAL ADEQUACY SCORE (0-10)
Did the speaker successfully communicate what they intended? Score 0-10 and explain:
- What was the communicative goal of each utterance?
- Which utterances achieved their goal despite grammatical errors?
- Which failed to communicate effectively even if grammatically correct?
- Give 1-2 specific examples with quotes.

3. LINGUISTIC RISK-TAKING INDEX (0-10)
Did the speaker play it safe or take linguistic risks? Score 0-10:
- Safe plays: simple structures, repeated vocabulary, short sentences (cite examples)
- Risks taken: complex clauses, less common vocabulary, abstractions (cite examples)
- Attempted constructions that partially failed (cite examples — these are the most valuable signal)
- Overall verdict: is this speaker expanding their frontier or staying in their comfort zone?

4. ONE-LINE CEFR ESTIMATE
Based ONLY on the patterns above (not word count or speed), what CEFR level does this speaker demonstrate and why?

Format your response as JSON with keys: avoidance, functional_adequacy, risk_index, cefr_estimate
Each key should have: score (where applicable), evidence (list of quotes), verdict (1-2 sentences)"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response.content[0].text

    # Extraer JSON de la respuesta
    try:
        start = raw.find("{")
        end   = raw.rfind("}") + 1
        result = json.loads(raw[start:end])
    except Exception:
        result = {"raw": raw}

    return result


def print_analysis(label: str, data: dict, analysis: dict):
    w = 68
    print("=" * w)
    print(f"  {label}")
    print("=" * w)

    print(f"\n  Words: {data['word_count']}  |  "
          f"Fillers: {data['filler_count']}  |  "
          f"Topics: {', '.join(data['topics'][:4])}")

    if "raw" in analysis:
        print("\n  [Claude raw response]")
        print(analysis["raw"])
        return

    sections = [
        ("AVOIDANCE DETECTION",      "avoidance"),
        ("FUNCTIONAL ADEQUACY",      "functional_adequacy"),
        ("LINGUISTIC RISK INDEX",     "risk_index"),
        ("CEFR ESTIMATE",            "cefr_estimate"),
    ]

    for title, key in sections:
        section = analysis.get(key, {})
        if not section:
            continue
        print(f"\n  [{title}]")
        if isinstance(section.get("score"), (int, float)):
            print(f"  Score: {section['score']}/10")
        if "verdict" in section:
            print(f"  Verdict: {section['verdict']}")
        evidence = section.get("evidence", [])
        if evidence:
            print("  Evidence:")
            for e in evidence[:3]:
                print(f"    - \"{e}\"")
    print()


def compare_two(label_a: str, data_a: dict, analysis_a: dict,
                label_b: str, data_b: dict, analysis_b: dict):

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    def safe_score(analysis, key):
        section = analysis.get(key, {})
        if isinstance(section, dict):
            return section.get("score", "?")
        return "?"

    print("=" * 68)
    print("  HEAD-TO-HEAD COMPARISON")
    print("=" * 68)
    print(f"\n  {'Metric':<30} {label_a[:16]:>16} {label_b[:16]:>16}")
    print("  " + "-" * 52)

    metrics = [
        ("Words",          data_a['word_count'],      data_b['word_count']),
        ("Fillers",        data_a['filler_count'],    data_b['filler_count']),
        ("Functional Adeq",safe_score(analysis_a,'functional_adequacy'),
                           safe_score(analysis_b,'functional_adequacy')),
        ("Risk Index",     safe_score(analysis_a,'risk_index'),
                           safe_score(analysis_b,'risk_index')),
    ]

    for name, va, vb in metrics:
        print(f"  {name:<30} {str(va):>16} {str(vb):>16}")

    # CEFR estimates
    cefr_a = analysis_a.get("cefr_estimate", {})
    cefr_b = analysis_b.get("cefr_estimate", {})
    print(f"\n  CEFR {label_a}: {cefr_a.get('verdict','?')}")
    print(f"  CEFR {label_b}: {cefr_b.get('verdict','?')}")

    # Ask Claude to compare
    print("\n  [Claude comparative verdict]")
    comp_prompt = f"""Compare these two language assessments and give a 3-sentence verdict on what distinguishes them linguistically. Focus only on what's qualitatively different, not quantities.

Speaker A ({label_a}):
- Avoidance: {analysis_a.get('avoidance',{}).get('verdict','')}
- Risk Index: {safe_score(analysis_a,'risk_index')}/10 — {analysis_a.get('risk_index',{}).get('verdict','')}
- CEFR: {cefr_a.get('verdict','')}

Speaker B ({label_b}):
- Avoidance: {analysis_b.get('avoidance',{}).get('verdict','')}
- Risk Index: {safe_score(analysis_b,'risk_index')}/10 — {analysis_b.get('risk_index',{}).get('verdict','')}
- CEFR: {cefr_b.get('verdict','')}

Answer in 3 sentences maximum. Be specific."""

    resp = client.messages.create(
        model=MODEL,
        max_tokens=300,
        messages=[{"role":"user","content": comp_prompt}]
    )
    print(f"\n  {resp.content[0].text}\n")


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file",    help="Single JSON file to analyze")
    parser.add_argument("--label",   default="Speaker", help="Label for output")
    parser.add_argument("--compare", nargs=2, metavar=("FILE_A","FILE_B"),
                        help="Compare two JSON files")
    args = parser.parse_args()

    if not ANTHROPIC_API_KEY:
        print("ERROR: set ANTHROPIC_API_KEY environment variable")
        exit(1)

    if args.compare:
        file_a, file_b = args.compare
        label_a = file_a.replace(".json","").replace("rich_","")
        label_b = file_b.replace(".json","").replace("rich_","")

        print(f"\nAnalizando {label_a}...")
        data_a     = load_transcript(file_a)
        analysis_a = analyze_with_claude(data_a, label_a)
        print_analysis(label_a, data_a, analysis_a)

        print(f"Analizando {label_b}...")
        data_b     = load_transcript(file_b)
        analysis_b = analyze_with_claude(data_b, label_b)
        print_analysis(label_b, data_b, analysis_b)

        compare_two(label_a, data_a, analysis_a,
                    label_b, data_b, analysis_b)

    elif args.file:
        data     = load_transcript(args.file)
        analysis = analyze_with_claude(data, args.label)
        print_analysis(args.label, data, analysis)
    else:
        parser.print_help()
