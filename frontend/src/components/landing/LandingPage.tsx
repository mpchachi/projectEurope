import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CometCard } from "./CometCard";
import { PointerHighlight } from "./PointerHighlight";

/* ── Constants ──────────────────────────────────────────────────────── */
const TOTAL_FRAMES     = 1046;
const SCROLL_PER_FRAME = 20;
const TOTAL_SCROLL     = TOTAL_FRAMES * SCROLL_PER_FRAME; // 20 920 px
const EXT              = "jpg";
const FRAME_OFFSET     = 15;

/* ── 12 overlays ────────────────────────────────────────────────────── */
const OVERLAYS = [
  { frame: 0,   duration: 87,  number: "01", title: "Talk Ratio",          insight: "You spoke 42% of the session. Up from 31% last week." },
  { frame: 87,  duration: 87,  number: "02", title: "New Words Today",     insight: "7 words appeared in your speech for the first time." },
  { frame: 174, duration: 87,  number: "03", title: "Top Errors",          insight: "3 recurring patterns. All fixable in one session." },
  { frame: 261, duration: 87,  number: "04", title: "Session Summary",     insight: "25 minutes. One conversation. A lot happened." },
  { frame: 348, duration: 87,  number: "05", title: "Conversational Agency", insight: "You initiated 4 topics today. Last session: 1." },
  { frame: 435, duration: 87,  number: "06", title: "Active Recall",       insight: "3 of 8 words from last week came back naturally." },
  { frame: 522, duration: 87,  number: "07", title: "Self-Repair Rate",    insight: "You caught 3 mistakes before Enric said a word." },
  { frame: 609, duration: 87,  number: "08", title: "Filler Pressure",     insight: "Your hesitations cluster around professional topics." },
  { frame: 696, duration: 87,  number: "09", title: "Code-Switching",      insight: "2 switches. Both when discussing abstract ideas." },
  { frame: 783, duration: 87,  number: "10", title: "Gray Zones",          insight: "Subjunctive avoided for 4 sessions in a row." },
  { frame: 870, duration: 87,  number: "11", title: "Sentiment Arc",       insight: "Confidence peaked at minute 20. You found your rhythm." },
  { frame: 957, duration: 89,  number: "12", title: "Topic Expansion",     insight: "Technology entered your world for the first time today." },
];

/* ── Cards ──────────────────────────────────────────────────────────── */
const CARDS = [
  { number: "01", title: "Talk Ratio",      stat: "42%",   statLabel: "you spoke",          description: "Most language apps track study time. We track who owns the conversation. At 42%, you're past the passive threshold — but the goal is 50%+. Every percentage point here is a minute you chose to speak instead of wait." },
  { number: "02", title: "New Words",       stat: "7",     statLabel: "new words today",    description: "There's a difference between words you recognise and words you reach for. These 7 appeared in your speech without prompting — no flashcard, no cue. That's your active vocabulary growing in real time." },
  { number: "03", title: "Top Errors",      stat: "3",     statLabel: "recurring patterns", description: "Random error counts create anxiety. Patterns create progress. These 3 recur because they're competing with a deeply wired rule from your native language. Name them, and they lose their power." },
  { number: "04", title: "Session Summary", stat: "25min", statLabel: "with Enric",         description: "Not a transcript. Not a grade. Two sentences that capture what this 25 minutes actually was — so when you sit down with Enric next week, you're continuing a story, not starting over." },
  { number: "05", title: "Agency Score",    stat: "61",    statLabel: "your highest yet",   description: "Fluency isn't just accuracy — it's initiative. This score measures how often you steered the conversation rather than followed it. You hit 61 today. Last session: 43. That jump is not small." },
  { number: "06", title: "Active Recall",   stat: "3/8",   statLabel: "words recycled",     description: "Forgetting isn't failure — it's the default. Active recall is the exception: a word Enric introduced last week that you used today, spontaneously, in context. 3 of 8 made it. That's a 37% retention rate. Track this weekly." },
  { number: "07", title: "Self-Repair",     stat: "3×",    statLabel: "self-corrections",   description: "Three times today you started a sentence wrong, caught it, and corrected yourself — before Enric said a word. That's not a mistake. That's your internal grammar monitor waking up. It's one of the earliest signs of real fluency forming." },
  { number: "08", title: "Filler Pressure", stat: "Work",  statLabel: "highest pressure",   description: "Uh, um, you know — everyone has them. But where they cluster is the signal. Yours pile up around professional vocabulary. That's not a confidence problem. It's a domain gap. One targeted session on work vocabulary changes this metric permanently." },
  { number: "09", title: "Code-Switching",  stat: "2×",    statLabel: "language switches",  description: "Both times you switched to Spanish today, you were navigating abstract ideas — justice, irony, hypotheticals. That's not weakness. It's a map. Your target language hasn't colonised that territory yet. Now you know exactly where to go next." },
  { number: "10", title: "Gray Zones",      stat: "4",     statLabel: "sessions avoided",   description: "Subjunctive has been absent from your speech for four consecutive sessions. You know it exists. You've studied it. But you route around it every time. Avoidance is different from ignorance — and it's the harder thing to fix. This is it." },
  { number: "11", title: "Sentiment Arc",   stat: "min 20",statLabel: "peak confidence",    description: "Your confidence isn't flat. It rises, dips, recovers. Today it peaked at minute 20 — right when the conversation shifted to travel. That topic is your safe harbour. The dip at minute 8 was the moment you tried reported speech for the first time. Worth it." },
  { number: "12", title: "Topic Expansion", stat: "1st",   statLabel: "Technology",         description: "For the first time, technology entered your conversational world in English. Not as a topic you were assigned — as one you brought yourself. That's the difference between studying a language and living in one. Your universe just got bigger." },
];

const CARD_POSITIONS: React.CSSProperties[] = [
  { bottom: 80,  right: 60  },
  { bottom: 120, right: 120 },
  { top:    80,  right: 60  },
  { bottom: 80,  right: 60  },
  { top:    120, right: 100 },
  { bottom: 160, right: 80  },
  { top:    80,  left:  400 },
  { top:    100, right: 140 },
  { top:    160, right: 60  },
  { bottom: 80,  right: 80  },
  { top:    100, left:  400 },
  { bottom: 140, right: 100 },
];

/* ── CardOverlay ─────────────────────────────────────────────────────── */
function CardOverlay({ cardIndex }: { cardIndex: number }) {
  const [displayed, setDisplayed] = useState(cardIndex);
  const [visible, setVisible]     = useState(cardIndex >= 0);

  useEffect(() => {
    if (cardIndex < 0) { setVisible(false); return; }
    setVisible(false);
    const t = setTimeout(() => { setDisplayed(cardIndex); setVisible(true); }, 80);
    return () => clearTimeout(t);
  }, [cardIndex]);

  const card = CARDS[displayed];
  const pos  = CARD_POSITIONS[displayed] ?? { bottom: 80, right: 60 };
  if (!card) return null;

  return (
    <div style={{ position: "fixed", ...pos, zIndex: 6, pointerEvents: "auto", opacity: visible ? 1 : 0, transition: "opacity 0.15s ease" }}>
      <CometCard rotateDepth={8} translateDepth={10}>
        <div style={{ width: 320, background: "rgba(236,237,241,0.92)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,71,133,0.15)", borderRadius: 24, padding: "28px 32px", boxShadow: "0 8px 48px rgba(255,71,133,0.08), 0 2px 12px rgba(0,0,0,0.06)", fontFamily: "var(--font-dm), system-ui, sans-serif" }}>
          <p style={{ fontFamily: "var(--font-dm), system-ui, sans-serif", fontSize: 11, fontWeight: 400, color: "rgba(255,71,133,0.6)", letterSpacing: "0.3em", margin: 0, marginBottom: 8 }}>{card.number}</p>
          <p style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 80, fontWeight: 900, color: "#FF4785", lineHeight: 0.9, margin: 0, marginBottom: 4 }}>{card.stat}</p>
          <p style={{ fontFamily: "var(--font-dm), system-ui, sans-serif", fontSize: 12, color: "rgba(255,71,133,0.45)", margin: 0, marginBottom: 20 }}>{card.statLabel}</p>
          <div style={{ height: 1, background: "rgba(255,71,133,0.2)", width: "100%" }} />
          <p style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(32px, 5vw, 44px)", fontWeight: 900, color: "#0a0a0a", lineHeight: 0.92, letterSpacing: "-0.03em", margin: 0, marginTop: 16, marginBottom: 12 }}>{card.title}</p>
          <p style={{ fontFamily: "var(--font-dm), system-ui, sans-serif", fontSize: 13, lineHeight: 1.65, color: "rgba(60,20,40,0.7)", fontWeight: 300, margin: 0 }}>{card.description}</p>
          <p style={{ fontFamily: "var(--font-dm), system-ui, sans-serif", fontSize: 11, fontStyle: "italic", color: "rgba(255,71,133,0.7)", borderLeft: "2px solid #FF4785", paddingLeft: 10, margin: 0, marginTop: 16 }}>{OVERLAYS[displayed]?.insight}</p>
        </div>
      </CometCard>
    </div>
  );
}

/* ── Loading screen ──────────────────────────────────────────────────── */
function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32 }}>
      <img src="/preply.webp" alt="Preply" style={{ width: 96, filter: "invert(1)", opacity: 0.9 }} />
      <div style={{ width: 220, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ height: 2, background: "#1a1a1a", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "#FF4785", borderRadius: 1, transition: "width 0.12s linear" }} />
        </div>
        <p style={{ fontFamily: "var(--font-dm), system-ui, sans-serif", fontSize: 11, color: "#444", letterSpacing: "0.15em", textTransform: "uppercase", textAlign: "center" }}>
          Loading your story&hellip;
        </p>
      </div>
    </div>
  );
}

/* ── Final section ───────────────────────────────────────────────────── */
function FinalSection({ onEnterDemo }: { onEnterDemo: () => void }) {
  return (
    <section style={{ position: "relative", zIndex: 10, background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px", gap: 80, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 400px", maxWidth: 560 }}>
        <p style={{ fontFamily: "var(--font-dm), system-ui, sans-serif", fontSize: 11, color: "#FF4785", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 28 }}>
          The Formula for Progress
        </p>
        <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(48px, 5.5vw, 80px)", fontWeight: 900, color: "#ffffff", lineHeight: 1.05, marginBottom: 28 }}>
          Consistency beats&nbsp;talent, every time.
        </h2>
        <p style={{ fontFamily: "var(--font-dm), system-ui, sans-serif", fontSize: 17, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, fontWeight: 300, maxWidth: 440 }}>
          You&rsquo;ve completed 12 sessions with Enric. Your agency score has risen 42&nbsp;points. The data doesn&rsquo;t lie —{" "}
          <PointerHighlight>
            you&rsquo;re becoming someone who speaks English
          </PointerHighlight>
          , not someone who studies it.
        </p>
      </div>

      <button
        onClick={onEnterDemo}
        style={{ display: "inline-block", background: "#FF4785", color: "#ffffff", fontFamily: "var(--font-dm), system-ui, sans-serif", fontWeight: 600, fontSize: 15, padding: "16px 36px", borderRadius: 999, border: "none", cursor: "pointer", letterSpacing: "0.02em", whiteSpace: "nowrap" }}
      >
        Probar demo →
      </button>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();

  const canvasRef         = useRef<HTMLCanvasElement>(null);
  const framesRef         = useRef<HTMLImageElement[]>([]);
  const loadedCountRef    = useRef(0);
  const currentFrameRef   = useRef(-1);
  const scrollYRef        = useRef(0);
  const rafRef            = useRef<number | null>(null);
  const isLockedRef       = useRef(false);
  const lastMetricRef     = useRef(-1);

  const overlayWrapRef    = useRef<HTMLDivElement>(null);
  const overlayNumRef     = useRef<HTMLParagraphElement>(null);
  const overlayTitleRef   = useRef<HTMLHeadingElement>(null);
  const overlayInsightRef = useRef<HTMLParagraphElement>(null);

  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoaded, setIsLoaded]         = useState(false);
  const [winH, setWinH]                 = useState(900);
  const [cardIndex, setCardIndex]       = useState(-1);

  useEffect(() => { setWinH(window.innerHeight); }, []);

  /* Preload frames */
  useEffect(() => {
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    framesRef.current = images;
    let loaded = 0;
    const BATCH = 12;
    let idx = 0;

    function loadNext() {
      const end = Math.min(idx + BATCH, TOTAL_FRAMES);
      for (let i = idx; i < end; i++) {
        const pad = String(i + 1).padStart(4, "0");
        const img = new Image();
        img.src = `/frames/frame_${pad}.${EXT}`;
        img.onload = img.onerror = () => {
          loaded++;
          loadedCountRef.current = loaded;
          const pct = Math.round((loaded / TOTAL_FRAMES) * 100);
          if (pct % 2 === 0 || loaded === TOTAL_FRAMES) setLoadProgress(pct);
          if (loaded === TOTAL_FRAMES) setIsLoaded(true);
        };
        images[i] = img;
      }
      idx = end;
      if (idx < TOTAL_FRAMES) setTimeout(loadNext, 16);
    }

    loadNext();
    return () => { framesRef.current = []; };
  }, []);

  /* Overlay + lock scroll */
  useEffect(() => {
    if (!isLoaded) return;

    let lastOverlayNumber = "";

    function updateOverlay(frameIdx: number) {
      const wrap = overlayWrapRef.current;
      const numEl = overlayNumRef.current;
      const titleEl = overlayTitleRef.current;
      const insightEl = overlayInsightRef.current;
      if (!wrap || !numEl || !titleEl || !insightEl) return;

      const lookaheadFrame = frameIdx + FRAME_OFFSET;
      let activeOv = null;
      for (const ov of OVERLAYS) {
        if (lookaheadFrame >= ov.frame && lookaheadFrame < ov.frame + ov.duration) {
          activeOv = ov;
          break;
        }
      }

      if (activeOv) {
        wrap.style.opacity = "1";
        if (activeOv.number !== lastOverlayNumber) {
          lastOverlayNumber = activeOv.number;
          numEl.textContent = activeOv.number;
          titleEl.textContent = activeOv.title;
          insightEl.textContent = activeOv.insight;
        }
      } else {
        wrap.style.opacity = "0";
      }
    }

    function checkMetricChange(frameIdx: number) {
      const lookaheadFrame = frameIdx + FRAME_OFFSET;
      let currentMetric = -1;
      for (let i = 0; i < OVERLAYS.length; i++) {
        const ov = OVERLAYS[i];
        if (lookaheadFrame >= ov.frame && lookaheadFrame < ov.frame + ov.duration) {
          currentMetric = i;
          break;
        }
      }

      if (currentMetric !== -1 && currentMetric !== lastMetricRef.current) {
        lastMetricRef.current = currentMetric;
        isLockedRef.current = true;
        const lockScrollY = OVERLAYS[currentMetric].frame * SCROLL_PER_FRAME;
        window.scrollTo({ top: lockScrollY, behavior: "instant" });
        setCardIndex(currentMetric);
        setTimeout(() => { isLockedRef.current = false; }, 1200);
      }
    }

    const onScroll = () => {
      scrollYRef.current = window.scrollY;
      const raw = Math.floor(window.scrollY / SCROLL_PER_FRAME);
      const frameIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, raw));
      updateOverlay(frameIdx);
      checkMetricChange(frameIdx);
    };

    const onWheel = (e: WheelEvent) => {
      if (!isLockedRef.current) return;
      e.preventDefault();
      const ov = OVERLAYS[lastMetricRef.current];
      if (ov) window.scrollTo({ top: ov.frame * SCROLL_PER_FRAME, behavior: "instant" });
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isLockedRef.current) return;
      e.preventDefault();
      const ov = OVERLAYS[lastMetricRef.current];
      if (ov) window.scrollTo({ top: ov.frame * SCROLL_PER_FRAME, behavior: "instant" });
    };

    window.addEventListener("scroll",    onScroll,    { passive: true });
    window.addEventListener("wheel",     onWheel,     { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    onScroll();

    return () => {
      window.removeEventListener("scroll",    onScroll);
      window.removeEventListener("wheel",     onWheel);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [isLoaded]);

  /* Canvas RAF */
  useEffect(() => {
    if (!isLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function sizeCanvas() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth  + "px";
      canvas.style.height = window.innerHeight + "px";
    }
    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);

    function drawCover(img: HTMLImageElement) {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      if (!iw || !ih) return;
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale, dh = ih * scale;
      const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    function tick() {
      const raw = Math.floor(scrollYRef.current / SCROLL_PER_FRAME);
      const frameIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, raw));
      if (frameIdx !== currentFrameRef.current) {
        currentFrameRef.current = frameIdx;
        const img = framesRef.current[frameIdx];
        if (img?.complete && img.naturalWidth) drawCover(img);
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    const first = framesRef.current[0];
    if (first?.complete) drawCover(first);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", sizeCanvas);
    };
  }, [isLoaded]);

  return (
    <>
      {!isLoaded && <LoadingScreen progress={loadProgress} />}

      <div style={{ position: "relative" }}>
        <div style={{ height: TOTAL_SCROLL + winH, position: "relative" }}>
          <canvas
            ref={canvasRef}
            style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#000", zIndex: 1, willChange: "contents" }}
          />

          <div
            ref={overlayWrapRef}
            style={{ position: "fixed", bottom: 72, left: 64, zIndex: 5, opacity: 0, maxWidth: 480, pointerEvents: "none" }}
          >
            <p ref={overlayNumRef} style={{ fontFamily: "var(--font-dm), system-ui, sans-serif", fontSize: 10, color: "#FF4785", letterSpacing: "0.5em", textTransform: "uppercase", fontWeight: 400, marginBottom: 8 }} />
            <h2 ref={overlayTitleRef} style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 64, fontWeight: 900, color: "#0a0a0a", lineHeight: 0.95, letterSpacing: "-0.02em", textShadow: "2px 2px 0px rgba(255,255,255,0.8), 4px 4px 0px rgba(255,71,133,0.15)" }} />
            <p ref={overlayInsightRef} style={{ fontFamily: "var(--font-dm), system-ui, sans-serif", fontSize: 14, color: "#333333", fontWeight: 300, lineHeight: 1.6, borderLeft: "2px solid #FF4785", paddingLeft: 12, marginTop: 16 }} />
          </div>
        </div>

        <FinalSection onEnterDemo={() => navigate("/demo")} />
      </div>

      <CardOverlay cardIndex={cardIndex} />
    </>
  );
}
