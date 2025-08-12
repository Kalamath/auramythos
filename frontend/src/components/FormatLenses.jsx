// src/components/FormatLenses.jsx
import React, { useMemo, useState } from "react";

/**
 * Default transformers (safe + simple). You can override all/any via props.
 * Expected shape: (text: string, title?: string) => string
 */
const defaultTransformers = {
  book: (text = "", title = "Your Story") => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const paras = [];
    for (let i = 0; i < sentences.length; i += 3) {
      paras.push(
        sentences
          .slice(i, i + 3)
          .join(" ")
          .trim()
      );
    }
    return [
      "📖 NOVEL FORMAT",
      "",
      "CHAPTER ONE",
      title,
      "",
      ...paras.map((p) => "     " + p),
    ].join("\n");
  },

  screenplay: (text = "", title = "Your Story") => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const hasDialogue = /"([^"]+)"|'([^']+)'/.test(text);
    const match = text.match(/"([^"]+)"|'([^']+)'/);
    const dialogue = match?.[1] || match?.[2];

    let out = `📽️ SCREENPLAY FORMAT


                    ${title.toUpperCase()}

                         Written by
                      
                      You & Aura


FADE IN:

INT. SCENE - DAY

${(sentences[0] || "").trim()}

`;
    if (hasDialogue) {
      out += `CHARACTER
    ${dialogue || "Your dialogue here"}

`;
    }
    (sentences.slice(1, 3) || []).forEach((s) => {
      out += s.trim() + "\n\n";
    });
    out += "FADE OUT.";
    return out;
  },

  comic: (text = "", title = "Your Story") => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const panels = sentences.slice(0, 6).map((s, i) => {
      const isDialogue = /"([^"]+)"|'([^']+)'/.test(s);
      const talk =
        s.match(/"([^"]+)"|'([^']+)'/)?.[1] ||
        s.match(/"([^"]+)"|'([^']+)'/)?.[2] ||
        "Dialogue here";
      const isAction = /\b(suddenly|then|crashed|ran|jumped|explodes?)\b/i.test(
        s
      );
      const line1 = s.trim().slice(0, 35);
      const line2 = s.trim().length > 35 ? s.trim().slice(35, 70) : "";

      return `
┌─────────────────────────────────────┐
│ PANEL ${i + 1}${isAction ? " - ACTION SHOT" : ""}       │
│                                     │
│ ${line1.padEnd(35, " ")} │
│ ${line2.padEnd(35, " ")} │
│                                     │
${
  isDialogue
    ? `│  ╭─────────────────────────╮       │
│  │ ${talk.slice(0, 23).padEnd(23, " ")} │       │
│  ╰─────────────────────────╯       │`
    : "│                                     │"
}
└─────────────────────────────────────┘`;
    });

    return `🎨 COMIC BOOK FORMAT

${title.toUpperCase()}
Issue #1

${panels.join("\n")}`;
  },
};

const LENSES = [
  { id: "book", label: "Book" },
  { id: "screenplay", label: "Screenplay" },
  { id: "comic", label: "Comic" },
];

const tabStyles = (active) => ({
  button: {
    padding: "8px 12px",
    borderRadius: "9999px",
    border: "1px solid #e2e8f0",
    background: active
      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      : "white",
    color: active ? "white" : "#334155",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all .2s ease",
    outline: "none",
  },
});

export default function FormatLenses({
  content = "",
  title = "Your Story",
  initialLens = "book",
  transformers = {},
  onLensChange,
  style,
  className,
}) {
  const [activeLens, setActiveLens] = useState(
    LENSES.some((l) => l.id === initialLens) ? initialLens : "book"
  );

  const t = useMemo(
    () => ({
      ...defaultTransformers,
      ...transformers,
    }),
    [transformers]
  );

  const previews = useMemo(() => {
    const safe = (fn) => {
      try {
        return fn(content, title);
      } catch (e) {
        return `⚠️ Preview error: ${e.message}`;
      }
    };
    return {
      book: safe(t.book),
      screenplay: safe(t.screenplay),
      comic: safe(t.comic),
    };
  }, [content, title, t]);

  const panelId = `lens-panel-${activeLens}`;

  return (
    <div
      className={className}
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        ...style,
      }}
    >
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Format lenses"
        style={{
          display: "flex",
          gap: 8,
          padding: 12,
          alignItems: "center",
          borderBottom: "1px solid #e2e8f0",
          background:
            "linear-gradient(180deg, rgba(248,250,252,.8), rgba(255,255,255,1))",
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "#64748b",
            marginRight: 6,
            userSelect: "none",
          }}
        >
          Preview as:
        </span>

        {LENSES.map((lens) => {
          const active = activeLens === lens.id;
          const s = tabStyles(active);
          return (
            <button
              key={lens.id}
              role="tab"
              aria-selected={active}
              aria-controls={panelId}
              id={`tab-${lens.id}`}
              onClick={() => {
                setActiveLens(lens.id);
                if (onLensChange) onLensChange(lens.id);
              }}
              style={s.button}
            >
              {lens.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={`tab-${activeLens}`}
        style={{
          padding: 16,
          maxHeight: 420,
          overflow: "auto",
          background: "linear-gradient(180deg, #ffffff, #fafbfc)",
          fontFamily:
            activeLens === "screenplay"
              ? `'Courier New', Courier, monospace`
              : "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          whiteSpace: "pre-wrap",
          lineHeight: 1.75,
          color: "#1f2937",
          fontSize: activeLens === "screenplay" ? 14 : 15,
        }}
      >
        {!content.trim() ? (
          <div style={{ color: "#94a3b8", fontStyle: "italic" }}>
            Start writing in the notebook to see a live {activeLens} preview…
          </div>
        ) : (
          previews[activeLens]
        )}
      </div>
    </div>
  );
}

export { FormatLenses };
