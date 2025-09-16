// src/DemoStorySystem.js
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * DemoStorySystem – Notebook-first (AudioPen-style)
 * - Name → greet → free notebook (same page).
 * - Lower-center toolbar attached to the paper with:
 *   • Single PNG-based Record button (your image drives the UI)
 *   • Insert JPEG button (simple picker + inline preview strip)
 * - Dock (words / read-time / autosave / Change name) attached to the paper.
 * - No portals; everything is rendered inside the notebook container.
 */

export function DemoStorySystem({
  initialGenre = "scifi",
  initialFormat = "comic",
  autoStart = true,
  // Record button customization
  recordButtonImageSrc = "/images/AuraMythosLogo.png", // your PNG path
  recordButtonSize = 48, // px
  recordButtonAlt = "Record",
  onExit,
}) {
  // -------------------- Flow --------------------
  // start → ask_name? → notebook
  const [phase, setPhase] = useState("start");
  const [userEntries, setUserEntries] = useState([]);

  // -------------------- User name (persisted) --------------------
  const NAME_KEY = "auramythos_user_name";
  const [userName, setUserName] = useState(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY);
      return saved ? saved.trim() : "";
    } catch {
      return "";
    }
  });

  // -------------------- Aura typing engine --------------------
  const [lines, setLines] = useState([]); // committed Aura lines
  const [typed, setTyped] = useState(""); // current typing buffer
  const queueRef = useRef([]); // strings only
  const typingRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const CHAR_DELAY = 24;
  const LINE_PAUSE = 650;

  const pushAura = (text) => {
    queueRef.current.push(text);
    if (!isTyping) {
      setIsTyping(true);
      setTyped("");
    }
  };

  useEffect(() => {
    return () => typingRef.current && clearTimeout(typingRef.current);
  }, []);

  useEffect(() => {
    if (!isTyping) return;
    const current = queueRef.current[0];
    if (!current) {
      setIsTyping(false);
      return;
    }

    if (typed.length === current.length) {
      typingRef.current = setTimeout(() => {
        setLines((prev) => [...prev, current]);
        queueRef.current.shift();
        setTyped("");

        if (queueRef.current.length === 0) {
          setIsTyping(false);
          if (phase === "start") {
            // after intro finishes, decide next phase
            setTimeout(() => {
              const saved = (userName || "").trim();
              if (saved && saved.length >= 2) {
                pushAura(
                  `Great to see you again, ${saved}. This is your notebook — type a few sentences or even a few paragraphs. Press Shift+Enter any time you want feedback.`
                );
                setPhase("notebook");
              } else {
                setPhase("ask_name");
              }
            }, 0);
          }
        } else {
          setIsTyping(true);
        }
      }, LINE_PAUSE);
      return () => clearTimeout(typingRef.current);
    }

    typingRef.current = setTimeout(
      () => setTyped(current.slice(0, typed.length + 1)),
      CHAR_DELAY
    );
    return () => clearTimeout(typingRef.current);
  }, [isTyping, typed, phase, userName]);

  // -------------------- Intro --------------------
  useEffect(() => {
    if (!autoStart) return;
    // React 18 StrictMode guard for double-mount
    const K = "__auramythos_demo_intro_once__";
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV !== "production"
    ) {
      const last = window[K] || 0;
      const now = performance.now();
      if (now - last < 1000) return;
      window[K] = now;
    }
    pushAura(
      "Hello there — I'm Aura, your personal writing assistant. Before we begin, what's your name?"
    );
  }, [autoStart, initialGenre, initialFormat]);

  // -------------------- Input handling --------------------
  const inputRef = useRef(null);
  const [nameDraft, setNameDraft] = useState("");

  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const analyzeTimer = useRef(null);

  // Media: mic + audio (fallback) + jpeg images
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);
  const [audioClips, setAudioClips] = useState([]);
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  const SpeechRecognition =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supportsSTT = !!SpeechRecognition;

  // Aggregate user-only creative text for metrics/autosave
  const aggregatedUserText = useMemo(() => {
    const parts = [...userEntries];
    if (phase === "notebook" && text?.trim()) parts.push(text.trim());
    return parts.join("\n");
  }, [userEntries, text, phase]);

  // Focus name input when needed
  useEffect(() => {
    if (!isTyping && phase === "ask_name") inputRef.current?.focus();
  }, [isTyping, phase]);

  useEffect(() => {
    if (phase === "ask_name") setNameDraft("");
  }, [phase]);

  const onNameKeyDown = (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    const isEnter = e.key === "Enter" || e.code === "Enter" || e.keyCode === 13;
    if (!isEnter) return;
    if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      submitName(nameDraft);
    }
  };

  useEffect(() => {
    const onGlobalShiftEnter = (e) => {
      if (e.isComposing || e.keyCode === 229) return;
      const isEnter =
        e.key === "Enter" || e.code === "Enter" || e.keyCode === 13;
      if (!isEnter || !e.shiftKey) return;
      if (phase !== "ask_name") return;
      e.preventDefault();
      e.stopPropagation();
      submitName(nameDraft);
    };
    window.addEventListener("keydown", onGlobalShiftEnter);
    return () => window.removeEventListener("keydown", onGlobalShiftEnter);
  }, [phase, nameDraft]);

  const submitName = (raw) => {
    const name = parseName(raw);
    if (!name || name.length < 2) {
      pushAura(
        "I didn’t catch that. A first name or nickname works perfectly."
      );
      return;
    }
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch {}
    setUserName(name);
    pushAura(
      `Great to meet you, ${name}. This is your notebook — type a few sentences, or even a few paragraphs. Press Shift+Enter when you want feedback.`
    );
    setPhase("notebook");
    requestAnimationFrame(() =>
      document.getElementById("auramythos-notebook-textarea")?.focus()
    );
  };

  // -------------------- Mic controls (single PNG button triggers start/stop) --------------------
  const startRecording = async () => {
    try {
      if (supportsSTT) {
        const r = new SpeechRecognition();
        r.continuous = true;
        r.interimResults = true;
        r.lang = "en-US";
        r.onresult = (ev) => {
          let finalChunk = "";
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const res = ev.results[i];
            const str = res[0]?.transcript || "";
            if (res.isFinal) finalChunk += str.endsWith(" ") ? str : str + " ";
          }
          if (finalChunk) setText((t) => (t ? t + " " : "") + finalChunk);
        };
        r.onend = () => setIsRecording(false);
        r.onerror = () => setIsRecording(false);
        recognitionRef.current = r;
        setIsRecording(true);
        r.start();
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaRecRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) =>
        e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioClips((prev) => [...prev, { url, ts: Date.now() }]);
        setText(
          (t) =>
            `${t}\n\n[Voice note attached at ${new Date().toLocaleTimeString()}]`
        );
        setIsRecording(false);
        stream.getTracks().forEach((tr) => tr.stop());
      };
      setIsRecording(true);
      rec.start();
    } catch (e) {
      console.warn("Mic start failed:", e);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setIsRecording(false);
      } else if (mediaRecRef.current) {
        mediaRecRef.current.stop();
      }
    } catch (e) {
      console.warn("Mic stop failed:", e);
      setIsRecording(false);
    }
  };

  // -------------------- JPEG insert --------------------
  const openImagePicker = () => fileInputRef.current?.click();
  const onPickImage = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!/jpe?g$/i.test(f.type) && !/\.jpe?g$/i.test(f.name)) {
      alert("Please select a JPEG image (.jpg/.jpeg)");
      e.target.value = "";
      return;
    }
    const url = URL.createObjectURL(f);
    setImages((prev) => [...prev, { url, name: f.name }]);
    setText((t) => `${t}\n\n[Inserted image: ${f.name}]`);
    e.target.value = "";
  };

  // -------------------- Metrics --------------------
  const userWordCount = useMemo(() => {
    const txt = (aggregatedUserText || "").trim();
    if (!txt) return 0;
    const m = txt.match(/[A-Za-z0-9’'_ -]+/g);
    return m ? m.length : 0;
  }, [aggregatedUserText]);

  const minutesRead = useMemo(
    () =>
      userWordCount === 0 ? 0 : Math.max(1, Math.ceil(userWordCount / 200)),
    [userWordCount]
  );

  // -------------------- Autosave --------------------
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const saveTimer = useRef(null);
  const SAVE_KEY = "auramythos_user_draft";

  const doSave = (payload) => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      setLastSavedAt(Date.now());
    } catch (e) {
      console.warn("Autosave failed:", e);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (!aggregatedUserText?.trim()) {
      setIsSaving(false);
      return;
    }
    setIsSaving(true);
    saveTimer.current = setTimeout(() => {
      doSave({
        ts: Date.now(),
        text: aggregatedUserText,
        words: userWordCount,
        genre: initialGenre,
        format: initialFormat,
      });
    }, 800);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [aggregatedUserText, userWordCount, initialGenre, initialFormat]);

  const manualSave = () => {
    if (!aggregatedUserText?.trim()) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setIsSaving(true);
    doSave({
      ts: Date.now(),
      text: aggregatedUserText,
      words: userWordCount,
      genre: initialGenre,
      format: initialFormat,
    });
  };

  const fmtTime = (ts) => {
    if (!ts) return "—";
    try {
      return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  // -------------------- Layout constants (keep button clear of dock) --------------------
  const recPx = Math.max(24, Number(recordButtonSize) || 48); // effective button size
  const DOCK_SAFE = 88; // vertical gap to keep above dock (px)
  const PAPER_PAD_BOTTOM = recPx + DOCK_SAFE + 48; // bottom padding for page

  // -------------------- Styles (paper-attached) --------------------
  const paperStyle = {
    maxWidth: 900,
    margin: "0 auto",
    position: "relative",
    padding: `0 0 ${PAPER_PAD_BOTTOM}px 0`,
  };
  const lineStyle = { marginBottom: 16 };
  const typingLineStyle = { marginBottom: 16, position: "relative" };
  const caretStyle = {
    display: "inline-block",
    marginLeft: 2,
    animation: "blink 1s infinite",
  };
  const transparentInputStyle = {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    fontFamily: "'Special Elite','Courier New',monospace",
    fontSize: 16,
    lineHeight: 1.8,
    color: "#2c3e50",
    resize: "none",
    padding: 0,
  };

  // Single PNG button (attached to the paper)
  const recWrap = {
    position: "sticky",
    bottom: DOCK_SAFE, // keeps the button safely above the dock
    width: "100%",
    display: "flex",
    justifyContent: "center",
    zIndex: 5, // stays above text
    pointerEvents: "none", // wrapper ignores clicks...
  };
  // Single PNG button styles
  const recBtn = {
    border: "none",
    background: "transparent",
    padding: 0,
    margin: 0,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    outline: "none",
    pointerEvents: "auto", // ...but the button itself still clickable
  };
  const recImg = (size) => ({
    height: size,
    width: size,
    objectFit: "contain",
    display: "block",
  });
  const jpegBtn = {
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  };

  // Dock (attached)
  const dockWrap = { position: "sticky", bottom: 8, width: "100%" };
  const dockInnerRow = { display: "flex", justifyContent: "center" }; // centered
  const dockInner = {
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    background: "transparent",
    color: "#374151",
    fontSize: 12,
    fontWeight: 600,
  };
  const dotStyle = { color: isSaving ? "#9ca3af" : "#10b981" };
  const dockSaveLink = (enabled) => ({
    border: "none",
    background: "transparent",
    padding: 0,
    marginLeft: 6,
    color: "#374151",
    cursor: enabled ? "pointer" : "default",
    opacity: enabled ? 1 : 0.5,
    textDecoration: "underline",
  });

  // -------------------- Helpers --------------------
  function parseName(input) {
    if (!input) return "";
    return String(input)
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[^\p{L}\p{N} .,'’-]/gu, "")
      .slice(0, 40);
  }

  const resetName = () => {
    try {
      localStorage.removeItem(NAME_KEY);
    } catch {}
    setUserName("");
    setPhase("ask_name");
    setNameDraft("");
    pushAura("Let's re-introduce — what should I call you?");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // --- Tiny analyzer (demo-safe) ---
  function runHeuristicPasses(txt) {
    const out = [];
    txt.replace(/\b(\w+)\s+\1\b/gi, (m, w, idx) => {
      out.push({
        id: "rep-" + idx,
        message: `Repeated word “${w}”`,
        before: m,
        after: w,
        start: idx,
        end: idx + m.length,
      });
      return m;
    });
    const sentenceRegex = /[^.!?]+[.!?]?(\s+|$)/g;
    let sm;
    while ((sm = sentenceRegex.exec(txt)) !== null) {
      const sent = sm[0];
      const start = sm.index;
      const words = (sent.match(/[A-Za-z0-9’'_ -]+/g) || []).length;
      if (words > 35) {
        out.push({
          id: "long-" + start,
          message: `Consider shortening this sentence (${words} words)`,
          before: sent.trim(),
          after: sent.trim(),
          start,
          end: start + sent.length,
        });
      }
    }
    return out;
  }

  // Suggestions pass while typing in notebook
  useEffect(() => {
    if (phase !== "notebook") return;
    if (analyzeTimer.current) clearTimeout(analyzeTimer.current);
    analyzeTimer.current = setTimeout(
      () => setSuggestions(runHeuristicPasses(text)),
      1200
    );
    return () => analyzeTimer.current && clearTimeout(analyzeTimer.current);
  }, [text, phase]);

  // Keyboard shortcuts in notebook
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") setPanelOpen(true);
      if (e.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const applySuggestion = (s) => {
    const next = text.slice(0, s.start) + s.after + text.slice(s.end);
    setText(next);
    setSuggestions(runHeuristicPasses(next));
  };

  return (
    <div style={{ paddingBottom: 0 }}>
      <div style={paperStyle}>
        {/* Aura transcript */}
        {lines.map((l, i) => (
          <div key={"line-" + i} style={lineStyle}>
            {l}
          </div>
        ))}

        {isTyping && (
          <div style={typingLineStyle}>
            {typed}
            <span style={caretStyle}>|</span>
          </div>
        )}

        {phase === "ask_name" && !isTyping && (
          <div style={{ marginTop: 8 }}>
            <textarea
              ref={inputRef}
              style={transparentInputStyle}
              placeholder="Enter your name and press Shift+Enter to submit"
              rows={1}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={onNameKeyDown}
              maxLength={60}
            />
          </div>
        )}

        {phase === "notebook" && (
          <>
            <div style={{ marginTop: 8 }}>
              <textarea
                id="auramythos-notebook-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Start typing your thoughts. A few sentences or even a few paragraphs are perfect. Press Shift+Enter when you want feedback."
                style={{
                  width: "100%",
                  minHeight: "60vh",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontFamily: "'Special Elite','Courier New',monospace",
                  fontSize: 16,
                  lineHeight: 1.8,
                  color: "#2c3e50",
                  resize: "none",
                  marginBottom: 24, // small nudge so caret never hides
                }}
              />
            </div>

            {/* Simple image previews */}
            {images.length > 0 && (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {images.map((im, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid #E5E7EB",
                      borderRadius: 8,
                      padding: 4,
                    }}
                  >
                    <img
                      src={im.url}
                      alt={im.name}
                      style={{ height: 72, width: "auto", display: "block" }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Simple audio clips list (fallback mode) */}
            {audioClips.length > 0 && (
              <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                {audioClips.map((a, idx) => (
                  <audio key={idx} src={a.url} controls />
                ))}
              </div>
            )}

            {/* Lower-center toolbar (attached) */}
            {/* Record button (only the PNG) */}
            <div style={recWrap}>
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                style={recBtn}
                aria-label={recordButtonAlt}
                aria-pressed={isRecording}
                title={recordButtonAlt}
              >
                {recordButtonImageSrc ? (
                  <img
                    src={recordButtonImageSrc}
                    alt={recordButtonAlt}
                    style={recImg(recPx)}
                  />
                ) : (
                  // fallback if you don't pass a PNG
                  <svg
                    width={recPx}
                    height={recPx}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    {isRecording ? (
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    ) : (
                      <circle cx="12" cy="12" r="6" />
                    )}
                  </svg>
                )}
              </button>
            </div>

            {/* Suggestions pill */}
            {suggestions.length > 0 && !panelOpen && (
              <div
                style={{
                  position: "sticky",
                  bottom: 40,
                  width: "100%",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    background: "#111827",
                    color: "white",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onClick={() => setPanelOpen(true)}
                  aria-label="Open Aura suggestions"
                >
                  ✦ Aura · {suggestions.length}
                </div>
              </div>
            )}

            {/* Bottom sheet panel */}
            <div
              style={{
                position: "sticky",
                bottom: 0,
                width: "100%",
                zIndex: 4,
                display: panelOpen ? "block" : "none",
              }}
              role="dialog"
              aria-label="Aura suggestions"
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.98)",
                  borderTop: "1px solid #E5E7EB",
                  boxShadow: "0 -10px 30px rgba(0,0,0,0.06)",
                  borderTopLeftRadius: 14,
                  borderTopRightRadius: 14,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <strong style={{ fontSize: 13 }}>
                    Aura suggestions · {suggestions.length}
                  </strong>
                  <button
                    onClick={() => setPanelOpen(false)}
                    style={{
                      fontSize: 12,
                      border: "none",
                      background: "transparent",
                      color: "#6B7280",
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>
                <div style={{ marginTop: 8 }}>
                  {suggestions.length === 0 ? (
                    <div style={{ opacity: 0.6, fontSize: 13 }}>
                      No suggestions. Looking good.
                    </div>
                  ) : (
                    suggestions.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          padding: "10px 0",
                          borderTop: "1px solid #F3F4F6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div style={{ fontSize: 13 }}>
                          <div style={{ fontWeight: 600 }}>{s.message}</div>
                          <div style={{ opacity: 0.7 }}>
                            <em>{s.before}</em> → <em>{s.after}</em>
                          </div>
                        </div>
                        <button
                          onClick={() => applySuggestion(s)}
                          style={{
                            fontSize: 12,
                            border: "1px solid #D1D5DB",
                            borderRadius: 8,
                            padding: "6px 10px",
                            background: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Dock (attached) */}
            <div style={dockWrap} aria-label="Notebook metrics">
              <div style={dockInnerRow}>
                <div style={dockInner}>
                  <span>📄 {userWordCount.toLocaleString()} words</span>
                  <span aria-hidden style={{ opacity: 0.5, padding: "0 6px" }}>
                    ·
                  </span>
                  <span>
                    ⏱️{" "}
                    {minutesRead > 0
                      ? `~${minutesRead} min read`
                      : "0 min read"}
                  </span>
                  <span aria-hidden style={{ opacity: 0.5, padding: "0 6px" }}>
                    ·
                  </span>
                  <span>
                    <span style={dotStyle}>•</span>{" "}
                    {isSaving ? "Saving…" : "Autosaved " + fmtTime(lastSavedAt)}
                    <button
                      type="button"
                      onClick={manualSave}
                      style={dockSaveLink(!!aggregatedUserText?.trim())}
                    >
                      Save
                    </button>
                  </span>
                  <span aria-hidden style={{ opacity: 0.5, padding: "0 6px" }}>
                    ·
                  </span>
                  <button
                    type="button"
                    onClick={resetName}
                    style={dockSaveLink(true)}
                  >
                    Change name
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Viewer kept for API compatibility
export function DemoStoryViewer({ text = "" }) {
  return (
    <div
      style={{
        whiteSpace: "pre-wrap",
        lineHeight: 1.8,
        fontFamily: "'Special Elite', 'Courier New', monospace",
      }}
    >
      {text || "No preview available yet."}
    </div>
  );
}
