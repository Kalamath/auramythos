// src/components/InlinePaperInput.jsx
import React, { useEffect, useRef, useState } from "react";

export default function InlinePaperInput({
  autoFocus = false,
  placeholder = "Type… (Enter to send, Shift+Enter for newline)",
  onSubmit,
}) {
  const [value, setValue] = useState("");
  const ref = useRef(null);

  // focus when shown
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  // auto-grow height with content
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 260) + "px"; // cap growth
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const v = value.trim();
      if (v) {
        onSubmit?.(v);
        setValue("");
      }
    }
  };

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      spellCheck={true}
      style={{
        display: "block",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",

        // transparent “typed on the paper” feel
        background: "transparent",
        border: "none",
        outline: "none",
        resize: "none",
        padding: 0,
        margin: "6px 0 0 0",

        // typewriter vibe
        lineHeight: 1.8,
        fontSize: 16,
        fontFamily:
          '"Special Elite", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        color: "#1f2937",
        caretColor: "#111827",

        // prevent right-edge clipping/overflow
        overflow: "hidden",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        whiteSpace: "pre-wrap",
      }}
    />
  );
}
