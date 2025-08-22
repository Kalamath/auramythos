// src/DemoStorySystem.js
import React, { useEffect, useRef, useState } from "react";
import FormatLenses from "./components/FormatLenses";
import NotebookPane from "./components/NotebookPane";
import InlinePaperInput from "./components/InlinePaperInput";

// --- message row wrapping (prevents right-edge overflow) ---
const msgRowStyle = {
  display: "grid",
  gridTemplateColumns: "max-content 1fr", // label | text
  columnGap: 6,
  alignItems: "start",
};

const msgLabelStyle = {
  fontWeight: 600,
  color: "#667eea",
};

const msgTextStyle = {
  display: "block",
  maxWidth: "100%", // ensure we can’t exceed column
  minWidth: 0, // allow shrinking in grid
  overflowWrap: "anywhere", // wrap long tokens/URLs
  wordBreak: "break-word",
  whiteSpace: "pre-wrap",
  lineHeight: 1.7,
  boxSizing: "border-box",
};

const uniqueId = (p = "m") =>
  `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// --- Aura text ---
const auraResponses = {
  welcome:
    "Hello! I'm Aura, your AI writing assistant ✨ I help transform your ideas into professional stories, scripts, and more. What should I call you?",
  introduction: (name) =>
    `Nice to meet you, ${name}! 😊 I can help you write in any format—novels, screenplays, comics, you name it. Ready to create something amazing together?`,
  storyPrompt:
    "Great! Start with your idea. Don’t worry about perfection—just write naturally. A few sentences is fine!",
  analyzing:
    "Interesting! Let me analyze this… spotting themes and narrative elements…",
};

// ---- Paper + Dock styles ----
const PAPER_MAX_W = 760;
const PAPER_SIDE_PAD = 16; // keep in sync with paperBodyStyle

const paperBodyStyle = {
  position: "relative",
  width: `min(${PAPER_MAX_W}px, 92vw)`,
  margin: "0 auto",
  padding: `0 ${PAPER_SIDE_PAD}px`,
  paddingBottom: 220,
  boxSizing: "border-box",
  textAlign: "left", // don’t inherit centering
};

function TypingText({ text, speed = 30 }) {
  const [shown, setShown] = useState("");
  const [i, setI] = useState(0);
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    if (!typing || i >= text.length) return;
    const v = Math.random() * 20 - 10;
    const t = setTimeout(() => {
      setShown((p) => p + text[i]);
      setI((p) => p + 1);
      if (i + 1 >= text.length) setTyping(false);
    }, speed + v);
    return () => clearTimeout(t);
  }, [typing, i, text, speed]);

  return (
    <span>
      {shown}
      {typing && (
        <span
          style={{
            animation: "blink 1s infinite",
            marginLeft: 2,
            color: "#667eea",
          }}
        >
          |
        </span>
      )}
    </span>
  );
}

const AuraThinking = () => (
  <div
    style={{
      marginBottom: 16,
      fontStyle: "italic",
      color: "#94a3b8",
      fontSize: 13,
    }}
  >
    <span style={{ animation: "pulse 2s infinite" }}>Aura is thinking…</span>
  </div>
);

export const DemoStorySystem = ({ onExit }) => {
  const endRef = useRef(null);
  const startedRef = useRef(false);
  const timersRef = useRef([]);
  const pushTimer = (t) => (timersRef.current.push(t), t);

  // paper ref + measured dock geometry
  const paperRef = useRef(null);
  const [dockGeom, setDockGeom] = useState({ left: 0, width: 0 });

  const [messages, setMessages] = useState([]);
  const [currentStage, setCurrentStage] = useState("welcome");
  const [isAuraTyping, setIsAuraTyping] = useState(false);
  const [isAuraThinking, setIsAuraThinking] = useState(false);
  const [awaitingInput, setAwaitingInput] = useState(false);

  // Notebook state (transparent, bottom-docked)
  const [userData, setUserData] = useState({ name: "", story: "" });
  const [isLensesOpen, setIsLensesOpen] = useState(false);

  // --- helpers ---
  const addAuraMessage = (text, done) => {
    const id = uniqueId("aura");
    setIsAuraTyping(true);
    setMessages((prev) => [
      ...prev,
      { id, type: "aura", content: text, isTyping: true },
    ]);
    const typingTime = Math.min(text.length * 30, 4000);
    pushTimer(
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isTyping: false } : m))
        );
        setIsAuraTyping(false);
        done && done();
      }, typingTime)
    );
  };

  const addUserMessage = (text) =>
    setMessages((p) => [
      ...p,
      { id: uniqueId("user"), type: "user", content: text },
    ]);

  // --- restore notebook text from localStorage (so the dock isn't empty) ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem("auramythos_notebook");
      if (saved && !userData.story) {
        setUserData((p) => ({ ...p, story: saved }));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- kickoff (asks name first) ---
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    pushTimer(
      setTimeout(() => {
        addAuraMessage(auraResponses.welcome, () => setAwaitingInput(true));
      }, 300)
    );

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // safety boot: if something cleared state during hot reload, reseed welcome
  useEffect(() => {
    const t = setTimeout(() => {
      if (messages.length === 0 && !isAuraTyping && !awaitingInput) {
        addAuraMessage(auraResponses.welcome, () => setAwaitingInput(true));
      }
    }, 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, isAuraTyping, awaitingInput]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, awaitingInput]);

  // --- measured dock alignment to paper’s inner column ---
  useEffect(() => {
    const measure = () => {
      const el = paperRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const left = Math.round(r.left + PAPER_SIDE_PAD);
      const width = Math.max(0, Math.round(r.width - 2 * PAPER_SIDE_PAD));
      setDockGeom({ left, width });
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    if (paperRef.current) ro.observe(paperRef.current);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, []);

  // --- routing ---
  const handleName = (name) => {
    setUserData((p) => ({ ...p, name }));
    setIsAuraThinking(true);
    pushTimer(
      setTimeout(() => {
        setIsAuraThinking(false);
        addAuraMessage(auraResponses.introduction(name), () => {
          pushTimer(
            setTimeout(() => {
              addAuraMessage("Let's create something! 🚀", () => {
                setCurrentStage("story_prompt");
                pushTimer(
                  setTimeout(() => {
                    addAuraMessage(auraResponses.storyPrompt, () => {
                      setCurrentStage("story_input");
                      setAwaitingInput(true);
                    });
                  }, 600)
                );
              });
            }, 500)
          );
        });
      }, 1200)
    );
  };

  const handleStory = (text) => {
    setUserData((p) => ({ ...p, story: text }));
    setIsAuraThinking(true);
    pushTimer(
      setTimeout(() => {
        setIsAuraThinking(false);
        addAuraMessage(auraResponses.analyzing, () => {
          setMessages((p) => [
            ...p,
            {
              id: uniqueId("actions"),
              type: "actions",
              content: [
                { action: "open_lenses", label: "Format Lenses ✨" },
                { action: "new_story", label: "Write New Story" },
              ],
            },
          ]);
        });
      }, 900)
    );
  };

  const routeUserText = (txt) => {
    if (!txt?.trim()) return;
    const clean = txt.trim();
    addUserMessage(clean);
    setAwaitingInput(false);

    if (currentStage === "welcome") return handleName(clean);
    if (currentStage === "story_input") return handleStory(clean);
  };

  const handleActionClick = (action) => {
    if (action === "open_lenses") return setIsLensesOpen(true);
    if (action === "new_story") {
      setMessages([]);
      setUserData((p) => ({ ...p, story: "" }));
      setCurrentStage("story_prompt");
      addAuraMessage("Alright, let’s start fresh! 🌱", () => {
        addAuraMessage(auraResponses.storyPrompt, () => {
          setCurrentStage("story_input");
          setAwaitingInput(true);
        });
      });
    }
  };

  // measured, paper-aligned dock styles (computed each render)
  const dockStyle = {
    position: "fixed",
    bottom: 12,
    left: dockGeom.left,
    width: dockGeom.width,
    zIndex: 2000,
    pointerEvents: "none",
  };
  const dockRow = {
    display: "flex",
    justifyContent: "flex-end",
    pointerEvents: "auto",
  };

  return (
    <>
      <style>{`
        @keyframes blink { 0%,60%{opacity:1} 61%,100%{opacity:0} }
        @keyframes pulse { 0%,100%{ opacity:.6 } 50%{ opacity:1 } }
      `}</style>

      {/* PAPER BODY (conversation prints here) */}
      <div style={paperBodyStyle} ref={paperRef}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 16 }}>
            {m.type === "aura" && (
              <div style={{ color: "#2c3e50" }}>
                <div style={msgRowStyle}>
                  <span style={{ ...msgLabelStyle, color: "#667eea" }}>
                    Aura:
                  </span>
                  <span style={msgTextStyle}>
                    {m.isTyping ? <TypingText text={m.content} /> : m.content}
                  </span>
                </div>
              </div>
            )}

            {m.type === "user" && (
              <div style={{ color: "#2c3e50" }}>
                <div style={msgRowStyle}>
                  <span
                    style={{
                      ...msgLabelStyle,
                      color: "#64748b",
                      fontStyle: "italic",
                    }}
                  >
                    You:
                  </span>
                  <span style={msgTextStyle}>{m.content}</span>
                </div>
              </div>
            )}

            {m.type === "actions" && (
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {m.content.map((a, i) => (
                  <button
                    key={`${m.id}-${i}`}
                    onClick={() => handleActionClick(a.action)}
                    style={{
                      padding: "8px 16px",
                      background:
                        a.action === "open_lenses" ? "#f59e0b" : "#667eea",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Inline input right under Aura’s last line */}
        {awaitingInput && (
          <>
            <div
              style={{
                color: "#64748b",
                fontStyle: "italic",
                marginTop: 8,
                marginBottom: 2,
              }}
            >
              <span style={{ fontWeight: 600 }}>You: </span>
            </div>
            <InlinePaperInput
              autoFocus
              placeholder={
                currentStage === "welcome"
                  ? "Enter your name… (Enter to send)"
                  : currentStage === "story_input"
                  ? "Write your story idea… (Enter to send, Shift+Enter for newline)"
                  : "Type your response…"
              }
              onSubmit={routeUserText}
            />
          </>
        )}

        {/* Spacer so chat never hides behind the bottom dock */}
        <div style={{ height: 220 }} />
        <div ref={endRef} />
      </div>

      {/* FOOTER DOCK (right-aligned inside paper’s inner ruled margins) */}
      <div style={dockStyle}>
        <div style={dockRow}>
          <NotebookPane
            compact
            title={`${userData.name || "Your"}'s Story`}
            value={userData.story}
          />
        </div>
      </div>

      {/* Format Lenses modal */}
      <FormatLenses
        isOpen={isLensesOpen}
        currentText={userData.story || ""}
        title={`${userData.name || "Your"}'s Story`}
        onApply={(transformed) => {
          setIsLensesOpen(false);
          setUserData((p) => ({ ...p, story: transformed }));
          setMessages((p) => [
            ...p,
            {
              id: uniqueId("result"),
              type: "aura",
              content: "Applied to Notebook ✅",
              isTyping: false,
            },
          ]);
        }}
        onCancel={() => setIsLensesOpen(false)}
      />
    </>
  );
};
