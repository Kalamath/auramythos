// src/DemoStorySystem.js
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * DemoStorySystem (refined)
 * - Types Aura's demo lines out.
 * - Bottom-right fixed metrics dock (Word Count, Auto-save, Minutes Read).
 * - Word/Read-time ONLY from userText (text the user typed), never from Aura's lines.
 * - Dock is fixed to the notebook's bottom-right via computed viewport offsets.
 */

export function DemoStorySystem({
  initialGenre = "scifi",
  initialFormat = "comic",
  autoStart = true,
  onExit, // kept for API compatibility; unused now
  /** Pass ONLY user-authored text here (aggregated). */
  userText = "",
}) {
  // --- Demo script -----------------------------------------------------------
  const script = useMemo(() => {
    return [
      `Hey — I'm Aura. Let’s try a quick ${initialGenre} ${initialFormat} together. ✨`,
      `Picture it: a quiet station, lights humming, one console blinking.`,
      `A lone astronaut leans in. The signal cuts through static: three notes, then silence.`,
      `Do we trace it — or barricade the doors?`,
      `That’s the spark. From here, we branch, explore, and shape your story on the page.`,
      `Ready? We can turn this into panels, scenes, or chapters in seconds.`,
    ];
  }, [initialGenre, initialFormat]);

  // --- Typing state (Aura’s demo text) --------------------------------------
  const [isPlaying, setIsPlaying] = useState(!!autoStart);
  const [lineIndex, setLineIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [lines, setLines] = useState([]);
  const typingRef = useRef(null);
  const containerRef = useRef(null);
  const scrollerRef = useRef(null);

  const charDelay = 24;
  const linePause = 650;

  // Find the scrollable area (".scrollable-content") so we can scroll-to-bottom & anchor the dock
  useEffect(() => {
    scrollerRef.current =
      containerRef.current?.closest(".scrollable-content") || null;
  }, []);

  // Auto-scroll the scroller as Aura types
  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [lines, typed]);

  useEffect(() => {
    if (autoStart) setIsPlaying(true);
  }, [autoStart]);

  useEffect(() => {
    return () => typingRef.current && clearTimeout(typingRef.current);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (lineIndex >= script.length) return;

    const full = script[lineIndex];

    if (typed.length === full.length) {
      typingRef.current = setTimeout(() => {
        setLines((prev) => [...prev, full]);
        setTyped("");
        setLineIndex((i) => i + 1);
      }, linePause);
      return () => clearTimeout(typingRef.current);
    }

    typingRef.current = setTimeout(() => {
      setTyped(full.slice(0, typed.length + 1));
    }, charDelay);

    return () => clearTimeout(typingRef.current);
  }, [isPlaying, typed, lineIndex, script]);

  // --- Metrics (ONLY from userText) -----------------------------------------
  const userWordCount = useMemo(() => {
    const txt = (userText || "").trim();
    if (!txt) return 0;
    const m = txt.match(/[A-Za-z0-9’'_-]+/g);
    return m ? m.length : 0;
  }, [userText]);

  const minutesRead = useMemo(() => {
    if (userWordCount === 0) return 0;
    return Math.max(1, Math.ceil(userWordCount / 200)); // ~200 wpm
  }, [userWordCount]);

  // --- Auto-save (only userText) --------------------------------------------
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
      // eslint-disable-next-line no-console
      console.warn("Autosave failed:", e);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (!userText?.trim()) {
      // Nothing to save; clear state
      setIsSaving(false);
      return;
    }
    setIsSaving(true);
    saveTimer.current = setTimeout(() => {
      doSave({
        ts: Date.now(),
        text: userText,
        words: userWordCount,
        genre: initialGenre,
        format: initialFormat,
      });
    }, 800);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [userText, userWordCount, initialGenre, initialFormat]);

  const manualSave = () => {
    if (!userText?.trim()) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setIsSaving(true);
    doSave({
      ts: Date.now(),
      text: userText,
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

  // --- Fixed dock anchored to notebook bottom-right -------------------------
  // We compute viewport offsets so the dock hugs the notebook’s bottom-right corner.
  const [dockPos, setDockPos] = useState({ right: 16, bottom: 16 });

  const computeDockOffsets = () => {
    // scroller: .scrollable-content
    // notebook container is the parent of scroller (App.js structure)
    const scrollerEl = scrollerRef.current;
    const notebookEl = scrollerEl?.parentElement || null;
    if (!notebookEl) {
      setDockPos({ right: 16, bottom: 16 });
      return;
    }
    const rect = notebookEl.getBoundingClientRect();
    const right = Math.max(16, window.innerWidth - rect.right + 16); // 16px inset
    const bottom = Math.max(16, window.innerHeight - rect.bottom + 16); // 16px inset
    setDockPos({ right, bottom });
  };

  useEffect(() => {
    computeDockOffsets();
    const onResize = () => computeDockOffsets();
    const onScroll = () => computeDockOffsets();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    // Also observe layout shifts within the notebook
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

  // --- Styles ---------------------------------------------------------------
  const lineStyle = { marginBottom: "16px" };
  const typingLineStyle = { marginBottom: "16px", position: "relative" };
  const caretStyle = {
    display: "inline-block",
    marginLeft: "2px",
    animation: "blink 1s infinite",
  };

  // (near other style consts)
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

  const pill = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 10px",
    border: "1px solid rgba(209,213,219,0.9)",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#374151",
    background: "rgba(255,255,255,0.95)",
    whiteSpace: "nowrap",
  };

  const dot = (active) => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: active ? "#10b981" : "#9ca3af",
    boxShadow: active ? "0 0 0 2px rgba(16,185,129,0.2)" : "none",
  });

  const saveBtn = {
    border: "1px solid rgba(209,213,219,0.9)",
    borderRadius: "6px",
    padding: "4px 8px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: userText?.trim() ? "pointer" : "default",
    color: userText?.trim() ? "#374151" : "#9ca3af",
    background: userText?.trim()
      ? "rgba(255,255,255,0.95)"
      : "rgba(255,255,255,0.6)",
  };

  return (
    <div ref={containerRef} style={{ paddingBottom: 0 }}>
      {/* Aura's committed lines */}
      {lines.map((l, i) => (
        <div key={`line-${i}`} style={lineStyle}>
          {l}
        </div>
      ))}

      {/* Typing line */}
      {lineIndex < script.length && (
        <div style={typingLineStyle}>
          {typed}
          <span style={caretStyle}>|</span>
        </div>
      )}

      {/* Subtle end marker */}
      {lineIndex >= script.length && (
        <div style={{ marginTop: "8px", opacity: 0.6 }}>
          — end of demo beat —
        </div>
      )}

      {/* Fixed metrics dock (no controls) */}
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
            style={saveLinkStyle(!!(userText && userText.trim()))}
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
