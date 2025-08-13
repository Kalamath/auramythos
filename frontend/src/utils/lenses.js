// src/utils/lenses.js
// Simple "format lenses" transformations. Keep them fast and deterministic.

export const LENSES = [
  {
    id: "comic",
    title: "🎨 Comic",
    desc: "Panels + bubbles for quick visual beats",
  },
  {
    id: "screenplay",
    title: "📽️ Screenplay",
    desc: "Sluglines, action, dialogue",
  },
  {
    id: "novel",
    title: "📖 Novel",
    desc: "Paragraphs with gentle cadence",
  },
];

const splitSentences = (text) => {
  const parts = text.match(/[^.!?]+[.!?]+/g);
  return parts && parts.length ? parts.map((s) => s.trim()) : [text.trim()];
};

const toComic = (text, title = "Your Story") => {
  const sentences = splitSentences(text);
  const panels = sentences
    .slice(0, 6)
    .map((s, i) => {
      const isAction =
        /\b(suddenly|then|crashed|ran|jumped|rushes|explodes)\b/i.test(s);
      const isDialogue = /"([^"]+)"/.test(s);
      const bubble = isDialogue ? s.match(/"([^"]+)"/)?.[1] || "…" : "";
      const line1 = s.slice(0, 36);
      const line2 = s.length > 36 ? s.slice(36, 72) : "";
      return [
        "┌─────────────────────────────────────┐",
        `│ PANEL ${i + 1}${isAction ? " - ACTION SHOT" : ""}${" ".repeat(
          Math.max(0, 23 - (String(i + 1).length + (isAction ? 13 : 0)))
        )}│`,
        "│                                     │",
        `│ ${line1.padEnd(35, " ")} │`,
        `│ ${line2.padEnd(35, " ")} │`,
        "│                                     │",
        isDialogue
          ? `│  ╭─────────────────────────╮       │\n│  │ ${
              bubble.slice(0, 21).ljust?.(21) ??
              bubble.slice(0, 21).padEnd(21, " ")
            } │       │\n│  ╰─────────────────────────╯       │`
          : "│                                     │",
        "└─────────────────────────────────────┘",
      ].join("\n");
    })
    .join("\n");

  return `🎨 COMIC BOOK FORMAT\n\n${title.toUpperCase()}\nIssue #1\n\n${panels}`;
};

const toScreenplay = (text, title = "Your Story") => {
  const sentences = splitSentences(text);
  const hasDialogue = /"([^"]+)"/.test(text);
  let out = `📽️ SCREENPLAY FORMAT\n\n\n                   ${title.toUpperCase()}\n\n                        Written by\n                         You & Aura\n\n\nFADE IN:\n\nINT. SCENE - DAY\n\n${(
    sentences[0] || ""
  ).trim()}\n\n`;
  if (hasDialogue) {
    const dialogue = text.match(/"([^"]+)"/)?.[1] || "Your dialogue here";
    out += `CHARACTER\n    ${dialogue}\n\n`;
  }
  sentences.slice(1, 3).forEach((s) => (out += s + "\n\n"));
  out += "FADE OUT.";
  return out;
};

const toNovel = (text, title = "Your Story") => {
  const sentences = splitSentences(text);
  const paras = [];
  for (let i = 0; i < sentences.length; i += 3) {
    paras.push("     " + sentences.slice(i, i + 3).join(" "));
  }
  return `📖 NOVEL FORMAT\n\nCHAPTER ONE\n${title}\n\n${paras.join(
    "\n\n     "
  )}\n`;
};

export const applyLens = (text, lensId, options = {}) => {
  const safe = (text || "").trim();
  const title = options.title || "Your Story";
  switch (lensId) {
    case "comic":
      return toComic(safe, title);
    case "screenplay":
      return toScreenplay(safe, title);
    case "novel":
      return toNovel(safe, title);
    default:
      return safe;
  }
};
