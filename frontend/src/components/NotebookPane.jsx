// src/components/NotebookPane.jsx
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getCaretOffset,
  setCaretOffset,
  insertTextAt,
} from "../utils/caretUtils";
import {
  countWords,
  readingTimeMinutes,
  downloadFile,
  toMarkdown,
  toFountain,
} from "../utils/exporters";

/* ------------ styles ------------ */
const shellStyle = {
  position: "relative",
  height: "100%",
  background: "transparent",
  border: "none",
  borderRadius: 0,
  display: "grid",
  gridTemplateRows: "1fr",
};

const overlayBarStyle = {
  position: "absolute",
  top: 12,
  right: 12,
  display: "flex",
  gap: 8,
  alignItems: "center",
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(6px)",
  border: "1px solid #e5e7eb",
  borderRadius: 999,
  padding: "6px 8px",
  zIndex: 5,
};

const editorStyle = {
  padding: "64px 48px 96px 48px",
  overflow: "auto",
  outline: "none",
  whiteSpace: "pre-wrap",
  lineHeight: 1.8,
  fontSize: 16,
  background: "transparent",
  color: "#1f2937",
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
};

const statsPillStyle = {
  position: "absolute",
  bottom: 12,
  right: 12,
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(6px)",
  border: "1px solid #e5e7eb",
  borderRadius: 999,
  padding: "6px 10px",
  color: "#6b7280",
  fontSize: 12,
  zIndex: 4,
};

const chip = (primary = false) => ({
  padding: "6px 10px",
  borderRadius: 999,
  border: primary ? "none" : "1px solid #e5e7eb",
  background: primary ? "linear-gradient(135deg,#667eea,#764ba2)" : "white",
  color: primary ? "white" : "#374151",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 12,
});

const saveDot = (ok = true) => ({
  display: "inline-block",
  width: 8,
  height: 8,
  borderRadius: 9999,
  background: ok ? "#10b981" : "#f59e0b",
  marginRight: 6,
});

/* NEW: compact footer row (transparent) */
const compactRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  color: "#6b7280",
  fontSize: 12,
  background: "transparent",
  padding: 0,
};

const slashMenuStyle = (pos) => ({
  position: "fixed",
  left: Math.max(10, Math.min(pos?.x ?? 0, window.innerWidth - 260)),
  top: Math.max(50, Math.min(pos?.y ?? 0, window.innerHeight - 200)),
  width: 240,
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  boxShadow: "0 16px 40px rgba(0,0,0,0.15)",
  zIndex: 2000,
  padding: 8,
});

const slashItem = {
  padding: "8px 8px",
  borderRadius: 8,
  cursor: "pointer",
};

const TEMPLATES = {
  outline:
    "# Outline\n- Act I: Setup\n- Act II: Confrontation\n- Act III: Resolution\n",
  character:
    "## Character Sheet\nName:\nAge:\nGoal:\nFlaw:\nWants vs Needs:\nNotes:\n",
  scene:
    "INT./EXT. PLACE - TIME\nAction here...\n\nCHARACTER NAME\n    Dialogue line.\n",
  todo: "## To-Do\n[ ] Outline three scenes\n[ ] Name 2 supporting characters\n[ ] Rework opening paragraph\n",
};

function relativeTime(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 2) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

const NotebookPane = forwardRef(function NotebookPane(
  {
    title = "Your Story",
    value,
    onChange,
    onRequestOpenLenses,
    compact = false,
  },
  ref
) {
  const editorRef = useRef(null);
  const [lastSavedAt, setLastSavedAt] = useState(Date.now());
  const [saving, setSaving] = useState(false);
  const [showSlash, setShowSlash] = useState(false);
  const [slashPos, setSlashPos] = useState(null);

  // Expose `insertAtCaret` to parent (DemoStorySystem)
  useImperativeHandle(
    ref,
    () => ({
      insertAtCaret(snippet) {
        const el = editorRef.current;
        if (!el) return;
        const { next, newCaret } = insertTextAt(el, snippet, value || "");
        onChange?.(next);
        requestAnimationFrame(() => setCaretOffset(el, newCaret));
      },
    }),
    [value, onChange]
  );

  // Autosave to localStorage
  useEffect(() => {
    setSaving(true);
    const t = setTimeout(() => {
      try {
        localStorage.setItem("auramythos_notebook", value || "");
        setLastSavedAt(Date.now());
      } catch {}
      setSaving(false);
    }, 400);
    return () => clearTimeout(t);
  }, [value]);

  const stats = useMemo(() => {
    const wc = countWords(value || "");
    const mins = readingTimeMinutes(value || "");
    return { wc, mins };
  }, [value]);

  const handleInput = () => {
    onChange?.(editorRef.current?.innerText ?? "");
  };

  const handleKeyDown = (e) => {
    if (e.key === "/" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const r = sel.getRangeAt(0).getBoundingClientRect();
        setSlashPos({ x: r.left, y: r.top + r.height + 8 });
      } else {
        setSlashPos({ x: 140, y: 140 });
      }
      setShowSlash(true);
      return;
    }
    if (e.key === "Escape" && showSlash) {
      setShowSlash(false);
      e.preventDefault();
      return;
    }
  };

  const pickTemplate = (key) => {
    setShowSlash(false);
    const el = editorRef.current;
    if (!el) return;

    const base = value || "";
    let caret = getCaretOffset(el);
    let baseBefore = base.slice(0, caret);

    if (baseBefore.endsWith("/")) {
      baseBefore = baseBefore.slice(0, -1);
      const after = base.slice(caret);
      const next = baseBefore + "\n" + (TEMPLATES[key] || "") + after;
      const newCaret = baseBefore.length + 1 + (TEMPLATES[key] || "").length;
      onChange?.(next);
      requestAnimationFrame(() => setCaretOffset(el, newCaret));
      return;
    }

    const { next, newCaret } = insertTextAt(
      el,
      "\n" + (TEMPLATES[key] || ""),
      base
    );
    onChange?.(next);
    requestAnimationFrame(() => setCaretOffset(el, newCaret));
  };

  const exportMD = () => {
    downloadFile(
      `${(title || "story").replace(/\s+/g, "_").toLowerCase()}.md`,
      toMarkdown(title, value || "")
    );
  };
  const exportFountain = () => {
    downloadFile(
      `${(title || "story").replace(/\s+/g, "_").toLowerCase()}.fountain`,
      toFountain(title, value || "")
    );
  };

  /* ---------- COMPACT MODE (footer only) ---------- */
  if (compact) {
    return (
      <div style={compactRowStyle}>
        <span>
          {countWords(value || "").toLocaleString()} words • ~
          {readingTimeMinutes(value || "")} min read
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={saveDot(!saving)} />
          {saving ? "Saving…" : `Saved • ${relativeTime(lastSavedAt)}`}
        </span>
      </div>
    );
  }

  /* ---------- FULL EDITOR (unchanged) ---------- */
  return (
    <div style={shellStyle}>
      <div style={overlayBarStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#6b7280",
            fontSize: 12,
          }}
        >
          <span style={saveDot(!saving)} />
          {saving ? "Saving…" : `Saved • ${relativeTime(lastSavedAt)}`}
        </div>
        <button style={chip(false)} onClick={onRequestOpenLenses}>
          Format Lenses ✨
        </button>
        <button style={chip(false)} onClick={exportMD}>
          Export .md
        </button>
        <button style={chip(false)} onClick={exportFountain}>
          Export .fountain
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={editorStyle}
        spellCheck={true}
      >
        {value}
      </div>

      <div style={statsPillStyle}>
        {stats.wc.toLocaleString()} words • ~{stats.mins} min read
      </div>

      {showSlash && (
        <div
          style={slashMenuStyle(slashPos)}
          onMouseDown={(e) => e.preventDefault()}
        >
          {[
            ["outline", "Outline – 3 Acts"],
            ["character", "Character Sheet"],
            ["scene", "Scene Starter"],
            ["todo", "To-Do List"],
          ].map(([k, label]) => (
            <div
              key={k}
              style={slashItem}
              onClick={() => pickTemplate(k)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(102,126,234,0.08)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default NotebookPane;
