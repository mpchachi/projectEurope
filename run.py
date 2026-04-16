"""
run.py  —  12-Metric Post-Session Dashboard
Preply Hackathon 2026  |  Deepgram API + Claude LLM

USO:
  python run.py json rich_simple.json rich_complex.json
  python run.py preply "Student-1/lesson-1" "Student-1/lesson-3"
  python run.py audio session1.wav session2.wav
"""

import sys, os, json, urllib.request
from pathlib import Path
from collections import Counter
import anthropic

DG_KEY = os.environ.get("DEEPGRAM_API_KEY")
AN_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not DG_KEY or not AN_KEY:
    raise RuntimeError("Missing API keys — set DEEPGRAM_API_KEY and ANTHROPIC_API_KEY (see start.bat.example)")
MODEL  = "claude-sonnet-4-6"

STOPWORDS = {"the","a","an","and","or","but","in","on","at","to","for","of","with",
             "is","are","was","were","be","i","you","he","she","it","we","they",
             "my","your","its","this","that","so","just","like","yeah","okay","yes","no",
             "do","did","have","has","had","will","would","could","should","about","what",
             "when","where","who","how","then","also","just","there","their","been"}
FILLER_SET = {"uh","um","like","you know","i mean","sort of","kind of",
              "basically","literally","actually","right","so","hmm"}
W = 72

# ==============================================================================
# DEEPGRAM
# ==============================================================================

def transcribe_audio(audio_path: str) -> dict:
    cache = audio_path.rsplit(".",1)[0] + "_rich.json"
    if Path(cache).exists():
        print(f"  [Deepgram] Cache hit: {cache}")
        return json.load(open(cache, encoding="utf-8"))
    params = "&".join(["model=nova-3","language=en","punctuate=true","smart_format=true",
                       "paragraphs=true","utterances=true","filler_words=true","diarize=true",
                       "sentiment=true","topics=true","intents=true","summarize=v2","detect_language=true"])
    print(f"  [Deepgram] Transcribing {audio_path} ...")
    with open(audio_path,"rb") as f: audio = f.read()
    req = urllib.request.Request(f"https://api.deepgram.com/v1/listen?{params}",
        data=audio, headers={"Authorization":f"Token {DG_KEY}","Content-Type":"audio/wav"}, method="POST")
    result = json.loads(urllib.request.urlopen(req, timeout=180).read())
    json.dump(result, open(cache,"w",encoding="utf-8"), indent=2, ensure_ascii=False)
    print(f"  [Deepgram] Saved -> {cache}")
    return result

# ==============================================================================
# LOAD
# ==============================================================================

def load_preply(lesson_dir: str) -> dict:
    sw, tw, paras = [], [], []
    for fp in sorted(Path(lesson_dir).glob("*.json")):
        seg = json.load(open(fp, encoding="utf-8"))
        r   = seg.get("results",{})
        for ci, ch in enumerate(r.get("channels",[])):
            (sw if ci==0 else tw).extend(ch["alternatives"][0].get("words",[]))
        paras += r.get("paragraphs",{}).get("paragraphs",[])
    utts = [{"start":p.get("start",0),"end":p.get("end",0),
             "transcript":" ".join(s.get("text","") for s in p.get("sentences",[])),
             "speaker":0 if p.get("channel",1)==0 else 1,
             "sentiment":"neutral","sentiment_score":0.0}
            for p in sorted(paras, key=lambda x: x.get("start",0))
            if " ".join(s.get("text","") for s in p.get("sentences",[])).strip()]
    return {"_src":"preply","_sw":sw,"_tw":tw,
            "_stx":" ".join(w["word"] for w in sw),
            "_ttx":" ".join(w["word"] for w in tw),
            "results":{"utterances":utts,"summaries":[],"sentiments":{"segments":[]},
                       "topics":{"segments":[]},"intents":{"segments":[]}}}

def extract(data: dict) -> dict:
    r    = data.get("results",{})
    utts = r.get("utterances",[])
    if data.get("_src")=="preply":
        sw,tw,stx,ttx,aw = data["_sw"],data["_tw"],data["_stx"],data["_ttx"],data["_sw"]
    else:
        chs = r.get("channels",[])
        aw  = chs[0]["alternatives"][0].get("words",[]) if chs else []
        sw  = [w for w in aw if w.get("speaker",0)==0]
        tw  = [w for w in aw if w.get("speaker",0)==1]
        if not tw: sw,tw = aw,[]
        stx = " ".join(w["word"] for w in sw)
        ttx = " ".join(w["word"] for w in tw)

    def seg_time(seg):
        si,ei = seg.get("start_word",0), seg.get("end_word",0)
        ts = aw[si]["start"] if si<len(aw) else 0
        te = aw[min(ei,len(aw)-1)]["end"] if aw else 0
        return ts,te

    topics = []
    for seg in r.get("topics",{}).get("segments",[]):
        ts,te = seg_time(seg)
        for t in seg.get("topics",[]):
            topics.append({"topic":t.get("topic",""),"start":ts,"end":te,"text":seg.get("text","")})

    intents = []
    for seg in r.get("intents",{}).get("segments",[]):
        ts,te = seg_time(seg)
        for i in seg.get("intents",[]):
            intents.append({"intent":i.get("intent",""),"start":ts,"end":te})

    summs   = r.get("summaries",[])
    summary = summs[0].get("summary","") if summs else ""

    fillers = []
    for u in utts:
        if u.get("speaker",0)!=0: continue
        txt  = u.get("transcript","").lower()
        umid = (u.get("start",0)+u.get("end",0))/2
        for fw in FILLER_SET:
            if fw in txt.split() or f" {fw} " in f" {txt} ":
                top = next((t["topic"] for t in topics if t["start"]<=umid<=t["end"]),None)
                fillers.append({"filler":fw,"start":u.get("start",0),"end":u.get("end",0),"topic":top})

    return {"utts":utts,"sw":sw,"tw":tw,"stx":stx,"ttx":ttx,
            "topics":topics,"unique_topics":list(set(t["topic"] for t in topics)),
            "intents":intents,"summary":summary,"fillers":fillers}

# ==============================================================================
# METRICS
# ==============================================================================

def compute_metrics(f, prev_vocab=None, prev_tutor_vocab=None, prev_topics=None):
    sw,tw = f["sw"],f["tw"]

    # 01 Talk Ratio
    sd = sum(w["end"]-w["start"] for w in sw)
    td = sum(w["end"]-w["start"] for w in tw)
    tot = sd+td or 1
    talk = {"student_pct":round(sd/tot*100,1),"tutor_pct":round(td/tot*100,1),
            "sw_n":len(sw),"tw_n":len(tw),"passive": sd/tot < 0.35}

    # 02 New Words
    vocab = set(w["word"].lower() for w in sw if w["word"].isalpha() and w["word"].lower() not in STOPWORDS)
    new_w = vocab - prev_vocab if prev_vocab else vocab
    new_words = {"new":sorted(new_w),"new_n":len(new_w),"total":len(vocab)}

    # 08 Filler Pressure
    fp_by_topic = {}
    for fi in f["fillers"]:
        k = fi["topic"] or "Unknown topic"
        fp_by_topic[k] = fp_by_topic.get(k,0)+1
    worst = max(fp_by_topic,key=fp_by_topic.get) if fp_by_topic else None
    filler_pressure = {"total":len(f["fillers"]),"by_topic":fp_by_topic,"worst":worst}

    # 11 Sentiment Arc
    arc = [{"t":round(u.get("start",0),1),"s":u.get("sentiment","neutral"),
             "sc":round(u.get("sentiment_score",0.0),3)}
           for u in f["utts"] if u.get("speaker",0)==0]

    # 05 Agency (timing + question detection + intents)
    utts_s = sorted(f["utts"], key=lambda u: u.get("start",0))
    init=resp=0
    for i,u in enumerate(utts_s):
        if u.get("speaker",0)!=0: continue
        txt = u.get("transcript","").strip()
        if i==0: init+=1; continue
        gap = u.get("start",0)-utts_s[i-1].get("end",0)
        student_asks  = "?" in txt
        prev_tutor    = next((utts_s[j].get("transcript","")
                              for j in range(i-1,-1,-1) if utts_s[j].get("speaker",0)==1), "")
        tutor_asked   = "?" in prev_tutor
        student_long  = len(txt.split()) > 40
        if student_asks or gap > 2.0 or (not tutor_asked and student_long):
            init+=1
        else:
            resp+=1
    uniq_intents = list(set(i["intent"] for i in f["intents"]))
    base_sc = (init/(init+resp)*10) if (init+resp)>0 else 0
    agency_sc = min(round(base_sc+min(len(uniq_intents)*0.5,3.0),1),10.0)
    agency = {"init":init,"resp":resp,"intents":uniq_intents[:6],"score":agency_sc,
              "pct":round(init/(init+resp)*100,1) if (init+resp)>0 else 0}

    # 09 Code-switching
    cs = [{"t":round(u.get("start",0),1),"txt":u.get("transcript","")[:70],
           "lang":u.get("detected_language","en")}
          for u in f["utts"] if u.get("speaker",0)==0
          and u.get("detected_language","en") not in ("en","")]

    # 06 Active Recall
    ar_words=[]
    if prev_tutor_vocab:
        s_v = set(w["word"].lower() for w in sw if w["word"].isalpha())
        ar_words = sorted(s_v & prev_tutor_vocab)[:20]

    # 12 Topic Expansion
    cur = set(f["unique_topics"])
    new_t     = list(cur - prev_topics) if prev_topics else list(cur)
    growing_t = list(cur & prev_topics) if prev_topics else []

    return {"talk":talk,"new_words":new_words,"filler_pressure":filler_pressure,
            "sentiment_arc":arc,"agency":agency,"code_switch":{"n":len(cs),"inst":cs},
            "active_recall":{"words":ar_words,"n":len(ar_words)},
            "topic_exp":{"new":new_t,"growing":growing_t,"cur":list(cur)}}

# ==============================================================================
# LLM  (metrics 03 · 07 · 10 + CEFR + Session Summary)
# ==============================================================================

def llm_analyze(f: dict) -> dict:
    if not f["stx"].strip(): return {}
    print("  [Claude] Analyzing transcript...")
    client = anthropic.Anthropic(api_key=AN_KEY)
    topics_ctx = ", ".join(f["unique_topics"][:6]) or "general conversation"
    prompt = f"""You are an expert SLA (Second Language Acquisition) researcher.
Analyze this student's spoken English transcript. Be specific — cite EXACT quotes.
Topics discussed: {topics_ctx}

TRANSCRIPT:
{f["stx"][:4000]}

Respond ONLY with this exact JSON (no markdown, no extra text):
{{
  "session_summary": "2 sentences max: what topics were practiced and one standout linguistic moment",
  "top_errors": [
    {{"error": "exact quote from transcript", "correction": "corrected version", "type": "grammar|vocab|pronunciation", "explanation": "why this matters"}},
    {{"error": "...", "correction": "...", "type": "...", "explanation": "..."}},
    {{"error": "...", "correction": "...", "type": "...", "explanation": "..."}}
  ],
  "self_repairs": {{
    "count": <integer>,
    "examples": ["exact quote showing self-repair", "another one"],
    "verdict": "one sentence: what this reveals about metacognitive awareness"
  }},
  "gray_zones": {{
    "avoided": [
      {{"structure": "name of structure", "expected_because": "why a speaker at this level should use it", "evidence": "exact quote where they avoided it"}},
      {{"structure": "...", "expected_because": "...", "evidence": "..."}},
      {{"structure": "...", "expected_because": "...", "evidence": "..."}}
    ],
    "verdict": "one sentence on what these absences reveal about CEFR ceiling"
  }},
  "cefr": {{
    "level": "A2|B1|B2|C1",
    "confidence": "high|medium|low",
    "reasoning": "2 sentences citing specific evidence from the transcript"
  }},
  "topics_extracted": [
    {{"topic": "2-3 word topic name", "start_pct": <0-100>, "end_pct": <0-100>}},
    {{"topic": "...", "start_pct": <0-100>, "end_pct": <0-100>}}
  ]
}}

topics_extracted: 3-6 main topics in this transcript. start_pct/end_pct = percentage position in the transcript (0=beginning, 100=end) where the topic appears. Always include even if Deepgram already detected topics."""
    resp = client.messages.create(model=MODEL, max_tokens=1500,
                                  messages=[{"role":"user","content":prompt}])
    raw = resp.content[0].text.strip()
    try:
        s,e = raw.find("{"), raw.rfind("}")+1
        # Strip non-ASCII chars Claude sometimes includes
        clean = raw[s:e].encode("ascii","replace").decode("ascii")
        return json.loads(clean)
    except:
        return {"_raw": raw}

# ==============================================================================
# PRINT  —  12 METRIC DASHBOARD
# ==============================================================================

def hdr(n, tag, title, subtitle):
    print(f"\n{'-'*W}")
    print(f"  {n:02d}  [{tag}]  {title}")
    print(f"      {subtitle}")
    print(f"{'-'*W}")

def bar(v, mx=100, w=32, full="#", empty="·"):
    f = int(w*v/mx) if mx>0 else 0
    return full*f + empty*(w-f)

def print_dashboard(label, f, m, llm, prev=False):
    cefr  = llm.get("cefr",{}).get("level","?") if llm else "?"
    print(f"\n{'='*W}")
    print(f"  POST-SESSION DASHBOARD  ·  {label.upper()}")
    print(f"  Deepgram API + Claude LLM  ·  CEFR estimate: {cefr}")
    print(f"{'='*W}")

    # -- 01 TALK RATIO --------------------------------------------------------
    hdr(1,"BASE","TALK RATIO","Who spoke — and how much")
    tr = m["talk"]
    sp = tr["student_pct"]; tp = tr["tutor_pct"]
    print(f"  Student  [{bar(sp,100,34)}] {sp:>5.1f}%  ({tr['sw_n']} words)")
    print(f"  Tutor    [{bar(tp,100,34)}] {tp:>5.1f}%  ({tr['tw_n']} words)")
    if tr["passive"]:
        print(f"\n  >> WARNING: Student below 35% — passive session detected.")
        print(f"     Progress requires active output. Push for more student turns.")
    elif sp >= 55:
        print(f"\n  >> HEALTHY: Student owns the floor. Good output conditions.")
    else:
        print(f"\n  >> OK: Balanced session. Watch for passivity trend over time.")

    # -- 02 NEW WORDS ---------------------------------------------------------
    hdr(2,"BASE","NEW WORDS TODAY","Vocabulary that appeared for the first time")
    nw = m["new_words"]
    print(f"\n       {nw['new_n']:>4}  new words this session")
    print(f"      {nw['total']:>5}  total active vocabulary")
    if nw["new"]:
        pills = "  ".join(f"[{w}]" for w in nw["new"][:12])
        print(f"\n  {pills}")
    if nw["new_n"] == 0 and prev:
        print(f"\n  >> PLATEAU SIGNAL: Zero new vocabulary. Student may be in comfort zone.")
    elif nw["new_n"] >= 20:
        print(f"\n  >> STRONG GROWTH: Vocabulary expanding well.")

    # -- 03 TOP ERRORS --------------------------------------------------------
    hdr(3,"BASE","TOP 3 ERRORS","What went wrong — and the fix")
    errors = llm.get("top_errors",[]) if llm else []
    if errors:
        for i,e in enumerate(errors[:3],1):
            typ = e.get("type","").upper()
            print(f"\n  {i}. [{typ}]")
            print(f"     SAID:    \"{e.get('error','')}\"")
            print(f"     CORRECT: \"{e.get('correction','')}\"")
            if e.get("explanation"):
                print(f"     WHY:     {e.get('explanation','')}")
    else:
        print("  (LLM analysis unavailable)")

    # -- 04 SESSION SUMMARY ---------------------------------------------------
    hdr(4,"BASE","SESSION SUMMARY","What happened — in two lines")
    summary = (llm.get("session_summary","") if llm else "") or f["summary"]
    if summary:
        for line in summary.split(". "):
            if line.strip():
                print(f"  {line.strip().rstrip('.')}.")
    else:
        print(f"  Topics covered: {', '.join(f['unique_topics'][:5]) or 'general conversation'}")

    # -- 05 CONVERSATIONAL AGENCY ---------------------------------------------
    hdr(5,"DIFFERENTIATOR","CONVERSATIONAL AGENCY","Are you a passenger or a driver?")
    ag = m["agency"]
    print(f"\n       {ag['pct']:>4.0f}%  of turns were student-initiated")
    print(f"  [{bar(ag['score'],10,34)}]  {ag['score']:.1f} / 10")
    print(f"\n  Initiations: {ag['init']}   Responses: {ag['resp']}")
    if ag["intents"]:
        print(f"\n  Detected intents:")
        for intent in ag["intents"][:4]:
            print(f"    · {intent}")
    if ag["score"] <= 2:
        print(f"\n  >> REACTIVE: Student is mostly responding. No real conversational ownership yet.")
    elif ag["score"] >= 6:
        print(f"\n  >> PROACTIVE: Student is driving topics. Clear sign of emerging fluency.")
    else:
        print(f"\n  >> DEVELOPING: Some initiative. Goal: push to 60%+ student-initiated turns.")

    # -- 06 ACTIVE RECALL -----------------------------------------------------
    hdr(6,"DIFFERENTIATOR","ACTIVE RECALL","Did last session actually stick?")
    ar = m["active_recall"]
    if not prev:
        print("  (First session — no previous vocabulary to cross-reference)")
    elif ar["n"] == 0:
        print("  0 words from the tutor's last session appeared spontaneously today.")
        print("\n  >> No compounding detected. Learning may feel like isolated events.")
    else:
        print(f"\n  {ar['n']} words from last session used spontaneously today:\n")
        pills = "  ".join(f"[{w} v]" for w in ar["words"][:10])
        print(f"  {pills}")
        print(f"\n  >> COMPOUNDING: Last session's input is becoming active output.")

    # -- 07 SELF-REPAIR RATE --------------------------------------------------
    hdr(7,"DIFFERENTIATOR","SELF-REPAIR RATE","You caught your own mistakes")
    sr = llm.get("self_repairs",{}) if llm else {}
    count = sr.get("count",0)
    print(f"\n       {count:>3}  self-corrections before the tutor intervened")
    if sr.get("examples"):
        print(f"\n  Examples:")
        for ex in sr["examples"][:2]:
            print(f"    · \"{ex[:80]}\"")
    verdict = sr.get("verdict","")
    if verdict:
        print(f"\n  {verdict}")
    if count == 0:
        print(f"\n  >> SIGNAL: Zero self-repairs may indicate comfort zone operation,")
        print(f"     not fluency. Risk-taking produces self-repairs.")
    elif count >= 10:
        print(f"\n  >> HIGH MONITORING: Brain is checking output in real time.")
        print(f"     This is metacognition forming — not a failure metric.")

    # -- 08 FILLER PRESSURE MAP -----------------------------------------------
    hdr(8,"DIFFERENTIATOR","FILLER PRESSURE MAP","Where you hesitated — and why")
    fp = m["filler_pressure"]
    print(f"  Total fillers: {fp['total']}")
    if fp["by_topic"]:
        mx = max(fp["by_topic"].values())
        print()
        for topic, count in sorted(fp["by_topic"].items(), key=lambda x:-x[1]):
            b = bar(count, mx, 24)
            print(f"  {topic[:26]:<26} [{b}] {count}")
        if fp["worst"] and fp["worst"] != "Unknown topic":
            print(f"\n  >> BLOCKAGE: '{fp['worst']}' is the cognitive bottleneck.")
            print(f"     Fillers here = vocabulary domain not yet automatized.")
    else:
        print("  No topic-filler mapping available (enable Deepgram topics)")

    # -- 09 CODE-SWITCHING ----------------------------------------------------
    hdr(9,"DIFFERENTIATOR","CODE-SWITCHING DETECTOR","When you fell back to your native language")
    cs = m["code_switch"]
    print(f"\n       {cs['n']:>3}  switches to native language detected")
    if cs["n"] == 0:
        print("\n  Stayed in English throughout the session.")
        print("  >> GOOD: No code-switching detected.")
    else:
        print()
        for inst in cs["inst"][:3]:
            print(f"  · [{inst['lang'].upper()}] at {inst['t']}s: \"{inst['txt']}\"")
        print(f"\n  >> These moments reveal exactly where target language fails under load.")

    # -- 10 GRAY ZONES MAP ----------------------------------------------------
    hdr(10,"DIFFERENTIATOR","GRAY ZONES MAP","Grammar you avoided — not just got wrong")
    gz = llm.get("gray_zones",{}) if llm else {}
    avoided = gz.get("avoided",[])
    if avoided:
        print()
        for i,item in enumerate(avoided[:3],1):
            print(f"  {i}. {item.get('structure','?').upper()}")
            print(f"     Expected because: {item.get('expected_because','')}")
            print(f"     Evidence: \"{item.get('evidence','')[:80]}\"")
            print()
        verdict = gz.get("verdict","")
        if verdict:
            print(f"  >> {verdict}")
    else:
        print("  (LLM analysis unavailable)")

    # -- 11 SENTIMENT ARC -----------------------------------------------------
    hdr(11,"DIFFERENTIATOR","SENTIMENT ARC","Your confidence through the session — as a shape")
    arc = m["sentiment_arc"]
    if arc:
        sym = {"positive":"^","neutral":"·","negative":"v"}
        spark = "".join(sym.get(a["s"],"?") for a in arc)
        print(f"\n  [{spark}]")
        print()
        pos = sum(1 for a in arc if a["s"]=="positive")
        neg = sum(1 for a in arc if a["s"]=="negative")
        neu = sum(1 for a in arc if a["s"]=="neutral")
        total_arc = len(arc) or 1
        print(f"  Confident  [{bar(pos,total_arc,20)}] {round(pos/total_arc*100)}%")
        print(f"  Neutral    [{bar(neu,total_arc,20)}] {round(neu/total_arc*100)}%")
        print(f"  Under load [{bar(neg,total_arc,20)}] {round(neg/total_arc*100)}%")
        h1 = arc[:len(arc)//2]; h2 = arc[len(arc)//2:]
        n1 = sum(1 for a in h1 if a["s"]=="negative")
        n2 = sum(1 for a in h2 if a["s"]=="negative")
        print()
        if n2 < n1:
            print("  >> ARC: Started under pressure, gained confidence as session progressed.")
            print("     Classic warm-up pattern. Consider starting with familiar topics.")
        elif n2 > n1:
            print("  >> ARC: Opened well, pressure built toward the end.")
            print("     Cognitive load increases with topic complexity. Normal at this level.")
        else:
            print("  >> ARC: Consistent emotional state throughout.")
            if neg == 0:
                print("     Full neutral — may indicate comfort zone. No stretch detected.")
    else:
        print("  (No sentiment data — single-channel recording or Preply JSON)")
        print("  Enable diarize=true + sentiment=true in Deepgram for this metric.")

    # -- 12 TOPIC EXPANSION ---------------------------------------------------
    hdr(12,"DIFFERENTIATOR","TOPIC EXPANSION","Is your world getting bigger?")
    te = m["topic_exp"]
    if not prev:
        print(f"\n  Session topics ({len(te['cur'])}):")
        for t in te["cur"][:8]:
            print(f"    · {t}")
    else:
        if te["new"]:
            print(f"\n  NEW topics unlocked ({len(te['new'])}):")
            for t in te["new"]:
                print(f"    [NEW] {t}")
        if te["growing"]:
            print(f"\n  Recurring topics ({len(te['growing'])}):")
            for t in te["growing"][:4]:
                print(f"    [>>]  {t}")
        if not te["new"]:
            print("\n  >> No new topics this session.")
            print("     Student stayed in known conversational territory.")
            print("     Consider introducing an unfamiliar domain next session.")

    # -- CEFR -----------------------------------------------------------------
    if llm and "cefr" in llm:
        cefr = llm["cefr"]
        print(f"\n{'='*W}")
        print(f"  CEFR ESTIMATE  ·  {cefr.get('level','?')}  [{cefr.get('confidence','?').upper()} CONFIDENCE]")
        print(f"{'='*W}")
        print(f"  {cefr.get('reasoning','')}")

    print(f"\n{'='*W}\n")


# ==============================================================================
# PROGRESSION SUMMARY (multi-session)
# ==============================================================================

def print_progression(labels, all_m, all_llm):
    print(f"\n{'='*W}")
    print("  PROGRESSION SUMMARY  ·  SESSION OVER SESSION")
    print(f"{'='*W}")

    fmt = "  {:<28}" + "  {:>10}" * len(labels)
    print(fmt.format("METRIC", *[l[:10] for l in labels]))
    print("  " + "-"*(28+12*len(labels)))

    def row(name, fn):
        vals = []
        for m in all_m:
            try:   vals.append(fn(m))
            except: vals.append("?")
        print(fmt.format(name, *[str(v) for v in vals]))

    row("Talk time %",       lambda m: m["talk"]["student_pct"])
    row("New words",         lambda m: m["new_words"]["new_n"])
    row("Total vocab",       lambda m: m["new_words"]["total"])
    row("Fillers",           lambda m: m["filler_pressure"]["total"])
    row("Agency score /10",  lambda m: m["agency"]["score"])
    row("Active recall",     lambda m: m["active_recall"]["n"])

    cefrs = [llm.get("cefr",{}).get("level","?") if llm else "?" for llm in all_llm]
    row("CEFR estimate",     lambda m: cefrs[all_m.index(m)])

    if len(all_m) >= 2:
        a, b = all_m[0], all_m[-1]
        print(f"\n  Signals  (first -> last):")
        checks = [
            ("Talk time growing",   b["talk"]["student_pct"]         > a["talk"]["student_pct"]),
            ("Vocabulary expanding",b["new_words"]["total"]           > a["new_words"]["total"]),
            ("Fewer fillers",       b["filler_pressure"]["total"]     < a["filler_pressure"]["total"]),
            ("Agency increasing",   b["agency"]["score"]              > a["agency"]["score"]),
            ("Active recall",       b["active_recall"]["n"]           > 0),
        ]
        good = sum(1 for _,v in checks if v)
        for name, ok in checks:
            mark = "[GOOD]" if ok else "[WEAK]"
            print(f"    {mark}  {name}")
        print(f"\n  Overall: {good}/{len(checks)} positive signals")
        if good >= 4: print("  VERDICT: Clear progression detected.")
        elif good >= 2: print("  VERDICT: Mixed signals — improvement in some areas.")
        else: print("  VERDICT: Plateau or regression. Review tutor strategy.")

    print(f"\n  CEFR journey: {' -> '.join(cefrs)}")
    print()

# ==============================================================================
# MAIN
# ==============================================================================

def run_one(src, mode, prev_vocab=None, prev_tutor=None, prev_topics=None):
    if   mode=="audio":  data = transcribe_audio(src)
    elif mode=="json":   data = json.load(open(src, encoding="utf-8"))
    elif mode=="preply": data = load_preply(src)
    else: raise ValueError(mode)
    f   = extract(data)
    llm = llm_analyze(f)  # run first so we can use topics_extracted below

    # Inject LLM-extracted topics when Deepgram topics are unavailable (Preply data)
    if not f["topics"] and llm.get("topics_extracted"):
        max_t = max((u.get("end", 0) for u in f["utts"]), default=1) or 1
        f["topics"] = [
            {"topic": t["topic"],
             "start":  t.get("start_pct", 0)  / 100 * max_t,
             "end":    t.get("end_pct",   100) / 100 * max_t,
             "text":   ""}
            for t in llm["topics_extracted"]
            if isinstance(t, dict) and t.get("topic")
        ]
        f["unique_topics"] = [t["topic"] for t in llm["topics_extracted"]
                              if isinstance(t, dict) and t.get("topic")]
        # Rebuild fillers now that topics have timestamps
        fillers = []
        for u in f["utts"]:
            if u.get("speaker", 0) != 0: continue
            txt  = u.get("transcript", "").lower()
            umid = (u.get("start", 0) + u.get("end", 0)) / 2
            for fw in FILLER_SET:
                if fw in txt.split() or f" {fw} " in f" {txt} ":
                    top = next((t["topic"] for t in f["topics"]
                                if t["start"] <= umid <= t["end"]), None)
                    fillers.append({"filler": fw, "start": u.get("start", 0),
                                    "end": u.get("end", 0), "topic": top})
        f["fillers"] = fillers

    m = compute_metrics(f, prev_vocab, prev_tutor, prev_topics)
    return f, m, llm

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(0)

    mode, sources = sys.argv[1], sys.argv[2:]
    all_f, all_m, all_llm, labels = [], [], [], []
    pv = pt = ptp = None

    for i, src in enumerate(sources):
        label = Path(src).stem
        print(f"\n{'-'*W}\n  Processing [{i+1}/{len(sources)}]: {src}\n{'-'*W}")
        f, m, llm = run_one(src, mode, pv, pt, ptp)
        print_dashboard(label, f, m, llm, prev=(i>0))
        all_f.append(f); all_m.append(m); all_llm.append(llm); labels.append(label)
        pv  = set(w["word"].lower() for w in f["sw"] if w["word"].isalpha())
        pt  = set(w["word"].lower() for w in f["tw"] if w["word"].isalpha() and len(w["word"])>3)
        ptp = set(f["unique_topics"])

    if len(sources) >= 2:
        print_progression(labels, all_m, all_llm)
