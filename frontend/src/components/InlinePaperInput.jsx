// src/components/InlinePaperInput.jsx
import React, { useEffect, useRef, useState } from "react";

const wrap = {
  position: "relative",
  marginTop: 12,
  marginBottom: 16,
};

const editable = {
  minHeight: 24,
  outline: "none",
  whiteSpace: "pre-wrap",
  lineHeight: 1.8,
  fontSize: 16,
  background: "transparent",
  color: "#1f2937",
  // feel like it’s typed on the same line grid:
  padding: "2px 0",
};

const placeholderStyle = {
  position: "absolute",
  left: 0,
  top: 0,
  color: "#9ca3af",
  pointerEvents: "none",
  lineHeight: 1.8,
  fontSize: 16,
};

export default function InlinePaperInput({
  autoFocus = false,
  placeholder = "Type here… (Enter to send, Shift+Enter for newline)",
  onSubmit,
}) {
  const ref = useRef(null);
  const [hasText, setHasText] = useState(false);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = (ref.current?.innerText || "").trim();
      if (text) {
        onSubmit?.(text);
        ref.current.innerText = "";
        setHasText(false);
      }
    }
  };

  const handleInput = () => {
    setHasText(Boolean((ref.current?.innerText || "").trim().length));
  };

  return (
    <div style={wrap}>
      {!hasText && <div style={placeholderStyle}>{placeholder}</div>}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        spellCheck={true}
        style={editable}
      />
    </div>
  );
}
