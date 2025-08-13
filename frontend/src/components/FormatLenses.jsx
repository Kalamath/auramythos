// src/components/FormatLenses.jsx
import React, { useEffect, useMemo, useState } from "react";
import { LENSES, applyLens } from "../utils/lenses";

const backDropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  backdropFilter: "blur(6px)",
  zIndex: 1200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const panelStyle = {
  background: "white",
  width: "min(980px, 96vw)",
  height: "min(82vh, 900px)",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  overflow: "hidden",
};

const sidebarStyle = {
  borderRight: "1px solid #e5e7eb",
  padding: "16px",
  background:
    "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 60%)",
};

const previewStyle = {
  padding: "16px 18px",
  overflow: "auto",
  whiteSpace: "pre-wrap",
  lineHeight: 1.7,
  fontSize: "14px",
  color: "#1f2937",
  background: "linear-gradient(180deg, #fdfdfd, #ffffff)",
};

const headerStyle = {
  padding: "12px 16px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const btn = (primary = false) => ({
  padding: "10px 14px",
  borderRadius: "8px",
  border: primary ? "none" : "1px solid #e5e7eb",
  background: primary ? "linear-gradient(135deg,#667eea,#764ba2)" : "white",
  color: primary ? "white" : "#374151",
  fontWeight: 600,
  cursor: "pointer",
});

export default function FormatLenses({
  isOpen,
  currentText = "",
  title = "Your Story",
  onApply,
  onCancel,
  defaultLens = "comic",
}) {
  const [selected, setSelected] = useState(defaultLens);

  useEffect(() => {
    if (!isOpen) return;
    // reset selection each time you open
    setSelected(defaultLens);
  }, [isOpen, defaultLens]);

  const preview = useMemo(() => {
    try {
      return applyLens(currentText, selected, { title });
    } catch (e) {
      return "Could not render preview.";
    }
  }, [currentText, selected, title]);

  if (!isOpen) return null;

  return (
    <div style={backDropStyle} onClick={onCancel}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        {/* Left: lens list */}
        <div style={sidebarStyle}>
          <div style={{ fontWeight: 700, color: "#111827", marginBottom: 8 }}>
            Format Lenses
          </div>
          <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 12 }}>
            Try a format on your current text. This is a preview—nothing changes
            until you click Apply.
          </div>

          {LENSES.map((lens) => (
            <button
              key={lens.id}
              onClick={() => setSelected(lens.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background:
                  selected === lens.id ? "rgba(102,126,234,0.08)" : "white",
                marginBottom: 8,
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 2 }}>
                {lens.title}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{lens.desc}</div>
            </button>
          ))}
        </div>

        {/* Right: preview */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={headerStyle}>
            <div style={{ fontWeight: 600, color: "#374151" }}>
              Preview — {LENSES.find((l) => l.id === selected)?.title}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={btn(false)} onClick={onCancel}>
                Cancel
              </button>
              <button
                style={btn(true)}
                onClick={() => onApply?.(preview, { lensId: selected })}
              >
                Apply to Notebook
              </button>
            </div>
          </div>
          <div style={previewStyle}>{preview}</div>
        </div>
      </div>
    </div>
  );
}
