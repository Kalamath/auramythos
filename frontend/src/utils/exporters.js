// src/utils/exporters.js

export function countWords(text) {
  if (!text) return 0;
  const m = text.trim().match(/\b[\p{L}\p{N}’'-]+\b/gu); // unicode words
  return m ? m.length : 0;
}

export function readingTimeMinutes(text, wpm = 220) {
  const words = countWords(text);
  const mins = Math.max(1, Math.round(words / wpm));
  return mins;
}

export function downloadFile(
  filename,
  content,
  type = "text/plain;charset=utf-8"
) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function toMarkdown(title, body) {
  const safeTitle = (title || "Untitled").toString();
  const safeBody = (body || "").toString();
  return `# ${safeTitle}\n\n${safeBody}\n`;
}

// very lightweight Fountain-ish export (not a full converter)
export function toFountain(title, body) {
  const safeTitle = (title || "Untitled").toString();
  const lines = (body || "").toString().split(/\r?\n/);
  const header = `Title: ${safeTitle}\n\n`;
  // pass content through with simple normalization
  return header + lines.join("\n") + "\n";
}
