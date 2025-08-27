// src/DemoStorySystem.js
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * DemoStorySystem – Task 1 (Flow + Input + parseKeywords)
 * - Types Aura’s opening and prompt.
 * - Transparent, on-page input captures *user* keywords (Enter to submit).
 * - parseKeywords validates (needs 3+ tokens).
 * - Advances to scene_pending (we’ll generate the scene in Task 2).
 * - Dock: word count / read-time / autosave from *user-only* text.
 */

export function DemoStorySystem({
  initialGenre = "scifi",
  initialFormat = "comic",
  autoStart = true,
  onExit, // kept for API compatibility; unused now
}) {
  // -------------------- FLOW --------------------
  // start → collect_keywords → scene_pending (Task 1 ends here)
  const [phase, setPhase] = useState("start");
  const [keywords, setKeywords] = useState([]);
  const [userEntries, setUserEntries] = useState([]); // aggregate *user typed* text
  const aggregatedUserText = useMemo(
    () => userEntries.join("\n"),
    [userEntries]
  );

  // -------------------- Typing engine (Aura) --------------------
  const [lines, setLines] = useState([]); // committed aura lines
  const [typed, setTyped] = useState(""); // currently typing buffer
  const queueRef = useRef([]); // aura lines waiting to type
  const typingRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  const charDelay = 24;
  const linePause = 650;

  const pushAura = (text) => {
    queueRef.current.push(text);
    kickTyping();
  };

  const kickTyping = () => {
    if (isTyping) return;
    if (queueRef.current.length === 0) return;
    setIsTyping(true);
    setTyped("");
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
          // When we finish the opening prompt in start, move to collect_keywords
          if (phase === "start") setPhase("collect_keywords");
        } else {
          // continue typing next line
          setIsTyping(true);
        }
      }, linePause);
      return () => clearTimeout(typingRef.current);
    }
    typingRef.current = setTimeout(() => {
      setTyped(current.slice(0, typed.length + 1));
    }, charDelay);
    return () => clearTimeout(typingRef.current);
  }, [isTyping, typed, phase]);

  // -------------------- Notebook anchoring / scroll --------------------
  const containerRef = useRef(null);
  const scrollerRef = useRef(null);

  useEffect(() => {
    scrollerRef.current =
      containerRef.current?.closest(".scrollable-content") || null;
  }, []);

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [lines, typed]);

  // -------------------- Opening script (guarded for React 18 StrictMode) --------------------
  const DEV_GUARD_KEY = "__auramythos_demo_intro_once__";

  useEffect(() => {
    if (!autoStart) return;

    // Dev-only guard to skip the StrictMode duplicate mount
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV !== "production"
    ) {
      const last = window[DEV_GUARD_KEY] || 0;
      const now = performance.now();
      if (now - last < 1000) return; // second mount comes immediately; skip it
      window[DEV_GUARD_KEY] = now;
    }

    const intro = [
      `Hey — I'm Aura. Let’s try a quick ${initialGenre} ${initialFormat} together. ✨`,
      `Give me **three evocative words** (e.g., "rust, corridor, heartbeat"). I’ll spin a cold open.`,
    ];
    intro.forEach((l) => pushAura(l));
  }, [autoStart, initialGenre, initialFormat]);

  // -------------------- Input handling (transparent on-page) --------------------
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  // Allow Enter to submit; Shift+Enter makes a new line
  const handleKeyDown = (e) => {
    if (phase !== "collect_keywords") return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitKeywords(draft);
    }
  };

  const submitKeywords = (raw) => {
    const words = parseKeywords(raw);
    if (words.length < 3) {
      pushAura(
        `I need **three** strong words. Try something sensory or moody, like "ozone, flicker, footfalls".`
      );
      return;
    }
    // Record user text (for dock metrics/autosave)
    setUserEntries((prev) => [...prev, raw.trim()]);
    setKeywords(words);
    setDraft("");
    pushAura(`Got it: **${words.join(", ")}**. Let me set the scene…`);
    setPhase("scene_pending"); // Task 2 will render the scene
  };

  // -------------------- Metrics (user-only) --------------------
  const userWordCount = useMemo(() => {
    const txt = (aggregatedUserText || "").trim();
    if (!txt) return 0;
    const m = txt.match(/[A-Za-z0-9’'_-]+/g);
    return m ? m.length : 0;
  }, [aggregatedUserText]);

  const minutesRead = useMemo(() => {
    if (userWordCount === 0) return 0;
    return Math.max(1, Math.ceil(userWordCount / 200)); // ~200 wpm
  }, [userWordCount]);

  // -------------------- Autosave (user-only) --------------------
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const saveTimer = useRef(null);
  const SAVE_KEY = "auramythos_user_draft";

  const doSave = (payload) => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      setLastSavedAt(Date.now());
    } catch (e) {
      // best-effort only
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

  // -------------------- Dock anchoring (to notebook bottom-right) --------------------
  const [dockPos, setDockPos] = useState({ right: 16, bottom: 16 });
  const computeDockOffsets = () => {
    const scrollerEl = scrollerRef.current;
    const notebookEl = scrollerEl?.parentElement || null;
    if (!notebookEl) {
      setDockPos({ right: 16, bottom: 16 });
      return;
    }
    const rect = notebookEl.getBoundingClientRect();
    const right = Math.max(16, window.innerWidth - rect.right + 16);
    const bottom = Math.max(16, window.innerHeight - rect.bottom + 16);
    setDockPos({ right, bottom });
  };

  useEffect(() => {
    computeDockOffsets();
    const onResize = () => computeDockOffsets();
    const onScroll = () => computeDockOffsets();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => computeDockOffsets());
    if (scrollerRef.current?.parentElement) {
      ro.observe(scrollerRef.current.parentElement);
    }
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollerRef.current]);

  // -------------------- Styles --------------------
  const lineStyle = { marginBottom: "16px" };
  const typingLineStyle = { marginBottom: "16px", position: "relative" };
  const caretStyle = {
    display: "inline-block",
    marginLeft: "2px",
    animation: "blink 1s infinite",
  };

  const dockStyle = {
    position: "fixed",
    right: `${dockPos.right}px`,
    bottom: `${dockPos.bottom}px`,
    zIndex: 50,
    display: "inline-flex",
    alignItems: "center",
    gap: "12px",
    padding: 0,
    background: "transparent",
    border: "none",
    boxShadow: "none",
    pointerEvents: "auto",
    color: "#374151",
    fontSize: 12,
    fontWeight: 600,
  };

  const metricStyle = {
    whiteSpace: "nowrap",
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
  };

  const saveLinkStyle = (enabled) => ({
    border: "none",
    background: "transparent",
    padding: 0,
    marginLeft: 6,
    color: "#374151",
    cursor: enabled ? "pointer" : "default",
    opacity: enabled ? 1 : 0.5,
    textDecoration: "underline",
  });

  const transparentInputStyle = {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    fontFamily: "'Special Elite', 'Courier New', monospace",
    fontSize: "16px",
    lineHeight: "1.8",
    color: "#2c3e50",
    resize: "none",
    padding: 0,
  };

  // -------------------- Helpers --------------------
  function parseKeywords(input) {
    if (!input) return [];
    // Grab word-ish tokens, keep order, trim, drop empties
    const tokens = input.toLowerCase().match(/[a-z0-9’'_-]+/gi);
    if (!tokens) return [];
    // Keep first 3 (allow duplicates but usually not needed)
    return tokens.slice(0, 3);
  }

  // -------------------- Render --------------------
  return (
    <div ref={containerRef} style={{ paddingBottom: 0 }}>
      {/* Aura's committed lines */}
      {lines.map((l, i) => (
        <div key={`line-${i}`} style={lineStyle}>
          {l}
        </div>
      ))}

      {/* Aura typing line */}
      {isTyping && (
        <div style={typingLineStyle}>
          {typed}
          <span style={caretStyle}>|</span>
        </div>
      )}

      {/* User input row (transparent) */}
      {phase === "collect_keywords" && (
        <div style={{ marginTop: "8px" }}>
          <textarea
            ref={inputRef}
            style={transparentInputStyle}
            placeholder={`Type 3 words… then press Enter`}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      )}

      {/* Scene placeholder (we implement actual scene next task) */}
      {phase === "scene_pending" && (
        <div style={{ marginTop: "8px", opacity: 0.7 }}>
          (Scene generation comes next…)
        </div>
      )}

      {/* Fixed metrics dock (transparent) */}
      <div style={dockStyle} aria-label="Notebook metrics">
        <span style={metricStyle}>
          📄 {userWordCount.toLocaleString()} words
        </span>
        <span aria-hidden="true" style={{ opacity: 0.5, padding: "0 6px" }}>
          ·
        </span>
        <span style={metricStyle}>
          ⏱️ {minutesRead > 0 ? `~${minutesRead} min read` : "0 min read"}
        </span>
        <span aria-hidden="true" style={{ opacity: 0.5, padding: "0 6px" }}>
          ·
        </span>
        <span style={metricStyle}>
          <span style={{ color: isSaving ? "#9ca3af" : "#10b981" }}>•</span>{" "}
          {isSaving ? "Saving…" : `Autosaved ${fmtTime(lastSavedAt)}`}
          <button
            type="button"
            onClick={manualSave}
            style={saveLinkStyle(!!aggregatedUserText?.trim())}
          >
            Save
          </button>
        </span>
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
