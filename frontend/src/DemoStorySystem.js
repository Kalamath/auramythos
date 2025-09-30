// src/DemoStorySystem.js
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

/**
 * DemoStorySystem – Notebook-first (AudioPen-style)
 * - Name → greet → free notebook (same page).
 * - Lower-center toolbar attached to the paper with:
 *   • Single PNG-based Record button (your image drives the UI)
 *   • Insert JPEG button (simple picker + inline preview strip)
 * - Dock (words / read-time / autosave / Change name) attached to the paper.
 * - No portals; everything is rendered inside the notebook container.
 *
 * Props:
 * - recordButtonImageSrc (string)
 * - recordButtonSize (number)
 * - recordButtonAlt (string)
 * - onStartRecording?({ source: 'stt' | 'mediarec' })
 * - onStopRecording?({ source: 'stt', transcript?: string } | { source: 'mediarec', blob?: Blob, url?: string } | { source: 'stt'|'mediarec', error: string })
 * - onSubmit?({ text: string, userName: string, ts: number, entriesCount: number })
 */

export function DemoStorySystem({
  initialGenre = "scifi",
  initialFormat = "comic",
  autoStart = true,
  // Record button customization
  recordButtonImageSrc = "/images/AuraMythosLogo.png",
  recordButtonSize = 48, // px
  recordButtonAlt = "Record",
  onStartRecording,
  onStopRecording,
  onSubmit, // submit hook
  onExit,
}) {
  // -------------------- Flow --------------------
  // start → ask_name → notebook (always fresh on startup)
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
  }, [isTyping, typed]);

  // -------------------- Intro (ALWAYS start fresh at ask_name) --------------------
  useEffect(() => {
    if (!autoStart) return;

    // StrictMode double-mount guard
    const K = "__auramythos_intro_once__";
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV !== "production"
    ) {
      if (window[K]) return;
      window[K] = true;
    }

    pushAura(
      "Hello there — I'm Aura, your personal writing assistant. Before we begin, what's your name?"
    );
    setPhase("ask_name");

    // Focus name ASAP
    requestAnimationFrame(() => {
      const el = inputRef.current;
      el?.focus();
    });
  }, [autoStart, initialGenre, initialFormat]);

  // -------------------- Input handling --------------------
  const inputRef = useRef(null);
  const [nameDraft, setNameDraft] = useState("");

  const [text, setText] = useState("");

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

  // -------------------- Focus name input (robust) --------------------
  useLayoutEffect(() => {
    if (phase !== "ask_name") return;

    let tries = 0;
    let rafId;

    const focusNow = () => {
      const el = inputRef.current;
      if (!el) return;
      if (document.activeElement !== el) {
        el.focus({ preventScroll: false });
        try {
          const len = el.value?.length ?? nameDraft.length;
          el.setSelectionRange?.(len, len);
        } catch {}
      }
      if (document.activeElement !== el && tries < 10) {
        tries += 1;
        rafId = requestAnimationFrame(focusNow);
      }
    };

    rafId = requestAnimationFrame(focusNow);
    const tId = setTimeout(focusNow, 50);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(tId);
    };
  }, [phase, nameDraft]);

  useEffect(() => {
    if (phase === "ask_name") setNameDraft("");
  }, [phase]);

  // -------------------- Submit behavior (Shift+Enter only) --------------------
  const handleSubmit = useCallback(() => {
    if (phase === "ask_name") {
      const raw = (inputRef.current && inputRef.current.value) ?? nameDraft;
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
        `Great to meet you, ${name}. This is your notebook — type a few sentences, or even a few paragraphs. Press Shift+Enter to submit.`
      );
      setPhase("notebook");

      // Focus notebook with retries
      let tries = 0;
      const focusNotebook = () => {
        const ta = document.getElementById("auramythos-notebook-textarea");
        if (ta && document.activeElement !== ta) {
          ta.focus({ preventScroll: false });
          try {
            const len = ta.value?.length ?? 0;
            ta.setSelectionRange?.(len, len);
          } catch {}
        }
        if (document.activeElement !== ta && tries < 10) {
          tries += 1;
          requestAnimationFrame(focusNotebook);
        }
      };
      requestAnimationFrame(focusNotebook);
      return;
    }

    if (phase === "notebook") {
      const ta = document.getElementById("auramythos-notebook-textarea");
      const fromDom = (ta && ta.value) ?? text;
      const payload = (fromDom || "").trim();
      const nextCount = userEntries.length + (payload ? 1 : 0);
      if (payload) setUserEntries((prev) => [...prev, payload]);
      setText("");
      if (ta) ta.value = ""; // ensure DOM clears immediately

      onSubmit?.({
        text: payload,
        userName,
        ts: Date.now(),
        entriesCount: nextCount,
      });
    }
  }, [phase, nameDraft, text, userEntries.length, onSubmit, userName]);

  // --- Key helper (robust Shift+Enter detect) ---
  const isShiftEnterKey = (e) =>
    !!(
      e.shiftKey &&
      ((e.key || e.code) === "Enter" || e.keyCode === 13 || e.which === 13)
    );

  const onNameKeyDown = (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    if (isShiftEnterKey(e)) {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    }
    // Plain Enter = newline (allowed)
  };

  // -------------------- Mic controls (single PNG button triggers start/stop) --------------------
  const startRecording = async () => {
    try {
      if (supportsSTT) {
        const r = new SpeechRecognition();
        const sttFinalRef = { current: "" };
        r.continuous = true;
        r.interimResults = true;
        r.lang = "en-US";

        r.onstart = () => {
          setIsRecording(true);
          onStartRecording?.({ source: "stt" });
        };

        r.onresult = (ev) => {
          let finalChunk = "";
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const res = ev.results[i];
            const str = res[0]?.transcript || "";
            if (res.isFinal) {
              const piece = str.endsWith(" ") ? str : str + " ";
              finalChunk += piece;
            }
          }
          if (finalChunk) {
            sttFinalRef.current += finalChunk;
            setText((t) => (t ? t + " " : "") + finalChunk);
          }
        };

        r.onend = () => {
          setIsRecording(false);
          onStopRecording?.({
            source: "stt",
            transcript: (sttFinalRef.current || "").trim(),
          });
        };

        r.onerror = (ev) => {
          setIsRecording(false);
          onStopRecording?.({
            source: "stt",
            error: ev?.error || ev?.message || "SpeechRecognition error",
          });
        };

        recognitionRef.current = r;
        r.start();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaRecRef.current = rec;
      chunksRef.current = [];

      rec.onstart = () => {
        setIsRecording(true);
        onStartRecording?.({ source: "mediarec" });
      };

      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };

      rec.onstop = () => {
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          setAudioClips((prev) => [...prev, { url, ts: Date.now() }]);
          setText(
            (t) =>
              `${t}\n\n[Voice note attached at ${new Date().toLocaleTimeString()}]`
          );
          onStopRecording?.({ source: "mediarec", blob, url });
        } finally {
          setIsRecording(false);
          stream.getTracks().forEach((tr) => tr.stop());
        }
      };

      rec.start();
    } catch (e) {
      console.warn("Mic start failed:", e);
      setIsRecording(false);
      onStopRecording?.({
        source: supportsSTT ? "stt" : "mediarec",
        error: e?.message || String(e),
      });
    }
  };

  const stopRecording = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        return;
      }
      if (mediaRecRef.current) {
        mediaRecRef.current.stop();
        return;
      }
    } catch (e) {
      console.warn("Mic stop failed:", e);
      setIsRecording(false);
      onStopRecording?.({
        source: recognitionRef.current ? "stt" : "mediarec",
        error: e?.message || String(e),
      });
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
  const countWords = useCallback((s) => {
    if (!s) return 0;
    try {
      if (typeof Intl !== "undefined" && Intl.Segmenter) {
        const seg = new Intl.Segmenter("en", { granularity: "word" });
        let c = 0;
        for (const part of seg.segment(s)) {
          if (part.isWordLike) c += 1;
        }
        return c;
      }
    } catch {}
    // Fallback: token regex (letters/numbers, supports apostrophes/hyphens/underscores inside words)
    const tokens = s.match(/\b[\p{L}\p{N}]+(?:[’'_‑-][\p{L}\p{N}]+)*\b/gu);
    return tokens ? tokens.length : 0;
  }, []);

  const userWordCount = useMemo(
    () => countWords(aggregatedUserText),
    [aggregatedUserText, countWords]
  );

  const minutesRead = useMemo(
    () =>
      userWordCount === 0 ? 0 : Math.max(1, Math.ceil(userWordCount / 200)),
    [userWordCount]
  );

  // -------------------- Autosave --------------------
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const saveTimer = useRef(null);
  const manualSavingRef = useRef(false);
  const SAVE_KEY = "auramythos_user_draft";

  const doSave = (payload) => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      setLastSavedAt(Date.now());
    } catch (e) {
      console.warn("Autosave failed:", e);
    } finally {
      setIsSaving(false);
      manualSavingRef.current = false; // <-- done saving
    }
  };

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (!aggregatedUserText?.trim()) {
      setIsSaving(false);
      return;
    }
    manualSavingRef.current = false; // <-- background save
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
    manualSavingRef.current = true; // <-- foreground save
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
    zIndex: 5,
    pointerEvents: "none",
  };
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
    pointerEvents: "auto",
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

        {phase === "ask_name" && (
          <div style={{ marginTop: 8 }}>
            <textarea
              ref={inputRef}
              autoFocus
              style={transparentInputStyle}
              placeholder="Enter your name. Enter = newline. Shift+Enter = submit."
              rows={1}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={onNameKeyDown}
              maxLength={60}
              onKeyDownCapture={(e) => {
                if (isShiftEnterKey(e)) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit();
                }
              }}
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
                placeholder="Start typing. Enter = new paragraph. Shift+Enter = submit."
                onKeyDown={(e) => {
                  if (isShiftEnterKey(e)) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmit();
                  }
                }}
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
                  marginBottom: 24,
                }}
                onKeyDownCapture={(e) => {
                  if (isShiftEnterKey(e)) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmit();
                  }
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
                    {manualSavingRef.current && isSaving
                      ? "Saving…"
                      : "Autosaved " + fmtTime(lastSavedAt)}
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

      {/* Hidden JPEG picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,image/jpeg"
        style={{ display: "none" }}
        onChange={onPickImage}
      />
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
