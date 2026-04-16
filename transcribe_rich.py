"""
transcribe_rich.py — Procesa audio con Deepgram activando TODOS los features.

Uso:
  python transcribe_rich.py --audio grabacion.wav --output resultado.json

Features activados:
  - model: nova-3          (mejor precision)
  - diarize: true          (separa hablantes automaticamente)
  - sentiment: true        (positivo/negativo/neutro por utterance)
  - topics: true           (deteccion de temas)
  - intents: true          (que intenta decir el hablante)
  - detect_language: true  (detecta cambios de idioma = code-switching)
  - summarize: true        (resumen automatico del segmento)
  - utterances: true       (segmentacion fina de turnos)
  - filler_words: true     (uh, um, like automatico)
  - paragraphs: true       (agrupacion en parrafos)
  - punctuate: true
  - smart_format: true
"""

import argparse
import json
import os
import sys
from pathlib import Path

# ── Configuracion ──────────────────────────────────────────────────────────────
DEEPGRAM_API_KEY = os.environ.get("DEEPGRAM_API_KEY", "TU_API_KEY_AQUI")


def transcribe(audio_path: str, output_path: str):
    try:
        from deepgram import DeepgramClient, PrerecordedOptions, FileSource
    except ImportError:
        print("ERROR: pip install deepgram-sdk")
        sys.exit(1)

    if DEEPGRAM_API_KEY == "TU_API_KEY_AQUI":
        print("\nERROR: Pon tu API key de Deepgram.")
        print("  Opcion 1: variable de entorno:  set DEEPGRAM_API_KEY=tu_key")
        print("  Opcion 2: edita DEEPGRAM_API_KEY en este script\n")
        sys.exit(1)

    audio_path = Path(audio_path)
    if not audio_path.exists():
        print(f"ERROR: No existe el archivo {audio_path}")
        sys.exit(1)

    print(f"\n  Procesando: {audio_path} ({audio_path.stat().st_size / 1024:.0f} KB)")
    print("  Conectando con Deepgram...\n")

    client = DeepgramClient(api_key=DEEPGRAM_API_KEY)

    with open(audio_path, "rb") as f:
        audio_data = f.read()

    source: FileSource = {"buffer": audio_data}

    options = PrerecordedOptions(
        model           = "nova-3",
        language        = "en",
        punctuate       = True,
        smart_format    = True,
        paragraphs      = True,
        utterances      = True,
        filler_words    = True,
        diarize         = True,
        sentiment       = True,
        topics          = True,
        intents         = True,
        summarize       = True,
        detect_language = True,
    )

    print("  Enviando a Deepgram (puede tardar 30-60s)...")
    response = client.listen.rest.v("1").transcribe_file(source, options)

    result = response.to_dict()

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    # ── Resumen rapido ─────────────────────────────────────────────────────────
    print(f"\n  Guardado en: {output_path}")
    print("\n  --- Resumen rapido ---")

    results = result.get("results", {})

    # Transcripcion
    channels = results.get("channels", [])
    if channels:
        alt = channels[0]["alternatives"][0]
        words = alt.get("words", [])
        print(f"  Palabras transcritas:  {len(words)}")
        print(f"  Confianza media:       {sum(w.get('confidence',0) for w in words)/max(len(words),1):.3f}")

    # Utterances (turnos)
    utterances = results.get("utterances", [])
    if utterances:
        speakers = set(u.get("speaker") for u in utterances if u.get("speaker") is not None)
        print(f"  Hablantes detectados:  {len(speakers)} ({sorted(speakers)})")
        print(f"  Turnos totales:        {len(utterances)}")

    # Sentiment
    sentiments = results.get("sentiments", {})
    seg_sentiments = sentiments.get("segments", [])
    if seg_sentiments:
        counts = {"positive": 0, "negative": 0, "neutral": 0}
        for s in seg_sentiments:
            counts[s.get("sentiment", "neutral")] += 1
        print(f"  Sentiment:             {counts}")

    # Topics
    topics = results.get("topics", {})
    topic_segments = topics.get("segments", [])
    if topic_segments:
        all_topics = []
        for seg in topic_segments:
            for t in seg.get("topics", []):
                all_topics.append(t.get("topic", ""))
        unique_topics = list(set(all_topics))[:8]
        print(f"  Temas detectados:      {unique_topics}")

    # Summary
    summary = results.get("summary", {})
    if summary:
        short = results.get("summaries", [])
        if short:
            print(f"\n  Resumen automatico:\n  {short[0].get('summary', '')[:200]}")

    print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio",  required=True, help="Archivo de audio (.wav, .mp3)")
    parser.add_argument("--output", required=True, help="Archivo JSON de salida")
    args = parser.parse_args()
    transcribe(args.audio, args.output)
