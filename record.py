"""
record.py — Graba audio desde el micrófono y lo guarda como WAV.

Uso:
  python record.py --duration 120 --output mi_grabacion.wav

El script muestra un countdown y para solo cuando termina el tiempo
o pulsas Ctrl+C.
"""

import argparse
import wave
import time
import sys
import numpy as np
import sounddevice as sd

SAMPLE_RATE = 16000   # 16kHz — lo que prefiere Deepgram
CHANNELS    = 1       # mono
DTYPE       = "int16"


def record(duration_seconds: int, output_path: str):
    print(f"\n  Grabando {duration_seconds}s → {output_path}")
    print("  Pulsa Ctrl+C para parar antes.\n")
    print("  3...", end="", flush=True)
    time.sleep(1)
    print(" 2...", end="", flush=True)
    time.sleep(1)
    print(" 1...", end="", flush=True)
    time.sleep(1)
    print(" GRABANDO\n")

    frames = []
    start  = time.time()

    try:
        with sd.InputStream(samplerate=SAMPLE_RATE, channels=CHANNELS, dtype=DTYPE) as stream:
            while True:
                elapsed = time.time() - start
                remaining = duration_seconds - elapsed
                if remaining <= 0:
                    break
                bar_len  = 40
                filled   = int(bar_len * elapsed / duration_seconds)
                bar      = "#" * filled + "-" * (bar_len - filled)
                print(f"\r  [{bar}] {int(elapsed)}s / {duration_seconds}s  ", end="", flush=True)
                chunk, _ = stream.read(SAMPLE_RATE // 10)  # 100ms chunks
                frames.append(chunk)
    except KeyboardInterrupt:
        print("\n\n  Parado manualmente.")

    print("\n\n  Guardando audio...")
    audio_data = np.concatenate(frames, axis=0)

    with wave.open(output_path, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(2)  # int16 = 2 bytes
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(audio_data.tobytes())

    duration = len(audio_data) / SAMPLE_RATE
    size_kb   = audio_data.nbytes / 1024
    print(f"  Guardado: {output_path}  ({duration:.1f}s, {size_kb:.0f} KB)\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--duration", type=int, default=120,
                        help="Duracion en segundos (default: 120)")
    parser.add_argument("--output",   type=str, default="grabacion.wav",
                        help="Nombre del archivo de salida")
    args = parser.parse_args()
    record(args.duration, args.output)
