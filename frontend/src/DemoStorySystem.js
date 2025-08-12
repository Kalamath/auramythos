import React, { useState, useEffect, useRef } from "react";
import FormatLenses from "./components/FormatLenses";
// …and wherever you render the notebook preview:

<FormatLenses
  content={userContent.story}
  title={userContent.title || "Untitled"}
  initialLens="book"
  transformers={{
    book: writingAssistant.formatTransformers.novel,
    screenplay: writingAssistant.formatTransformers.screenplay,
    comic: writingAssistant.formatTransformers.comic,
  }}
  onLensChange={(lens) => console.log("Lens changed:", lens)}
/>;

// Aura's personality and responses
const auraResponses = {
  welcome:
    "Hello! I'm Aura, your AI writing assistant ✨ I help transform your ideas into professional stories, scripts, and more. What should I call you?",

  introduction: (name) =>
    `Nice to meet you, ${name}! 😊 I can help you write in any format - novels, screenplays, comics, you name it. I'll also provide personalized tips to improve your writing style. Ready to create something amazing together?`,

  storyPrompt:
    "Great! Let's start with your idea. Don't worry about making it perfect - just write naturally. Tell me a story, describe a scene, or share any creative idea you have... Even a few sentences will do! I'll help you develop it from there.",

  analyzing:
    "Interesting story! Let me analyze this... I can see some great potential here. I'm detecting themes and narrative elements...",

  genreQuestion:
    "I'm getting a sense of your story's direction. To give you the best suggestions, which genre fits your vision best?",

  formatQuestion: (genre) =>
    `Perfect! A ${genre} story has so many possibilities. Now, let's choose how to present your story. Each format has its own strengths - which speaks to you?`,

  transforming: (format) =>
    `Transforming your story into ${format} format... Applying professional formatting standards... Adding structure and style elements... Almost done...`,

  presenting:
    "Here's your professionally formatted story! ✨ I've maintained your voice while adding industry-standard formatting. Notice how the format changes the reading experience?",

  tips: {
    passive:
      "💡 I noticed some passive voice. Try making your verbs more active for stronger impact!",
    dialogue: "💡 Consider adding dialogue to bring your characters to life.",
    sensory:
      "💡 Adding sensory details (sight, sound, touch) can immerse readers deeper.",
    variety: "💡 Varying your sentence length creates better rhythm and flow.",
    goodStart: "✨ You have a strong narrative voice! Keep developing it.",
  },
};

// Typing component with natural speed variation
const TypingText = ({ text, onComplete, speed = 30 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (currentIndex < text.length && isTyping) {
      // Natural typing speed variation
      const variation = Math.random() * 20 - 10;
      const delay = speed + variation;

      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, delay);

      return () => clearTimeout(timeout);
    } else if (currentIndex >= text.length && isTyping) {
      setIsTyping(false);
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentIndex, text, isTyping, speed, onComplete]);

  return (
    <span>
      {displayedText}
      {isTyping && (
        <span
          style={{
            animation: "blink 1s infinite",
            marginLeft: "2px",
            color: "#667eea",
          }}
        >
          |
        </span>
      )}
    </span>
  );
};

// Aura thinking indicator
const AuraThinking = () => (
  <div
    style={{
      marginBottom: "16px",
      fontStyle: "italic",
      color: "#94a3b8",
      fontSize: "13px",
    }}
  >
    <span style={{ animation: "pulse 2s infinite" }}>Aura is thinking...</span>
  </div>
);

// Writing assistant logic
const writingAssistant = {
  analyzeStory: (text) => {
    const analysis = {
      wordCount: text.split(" ").length,
      hasDialogue: text.includes('"') || text.includes("'"),
      hasAction: /\b(ran|jumped|crashed|fell|grabbed|threw)\b/i.test(text),
      mood: /\b(dark|bright|happy|sad|mysterious|dangerous)\b/i.test(text)
        ? "atmospheric"
        : "neutral",
      tips: [],
    };

    // Generate tips based on analysis
    if (text.includes("was") || text.includes("were")) {
      analysis.tips.push("passive");
    }
    if (!analysis.hasDialogue) {
      analysis.tips.push("dialogue");
    }
    if (!/\b(saw|heard|felt|smelled|touched)\b/i.test(text)) {
      analysis.tips.push("sensory");
    }
    if (analysis.wordCount > 20 && !text.includes(",")) {
      analysis.tips.push("variety");
    }
    if (analysis.tips.length === 0) {
      analysis.tips.push("goodStart");
    }

    return analysis;
  },

  formatTransformers: {
    comic: (text, title = "Your Story") => {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const panels = sentences
        .slice(0, 6)
        .map((sentence, i) => {
          const isDialogue = sentence.includes('"') || sentence.includes("'");
          const isAction = /\b(suddenly|then|crashed|ran|jumped)\b/i.test(
            sentence
          );

          return `
┌─────────────────────────────────────┐
│ PANEL ${i + 1}${isAction ? " - ACTION SHOT" : ""}       │
│                                     │
│ ${sentence.trim().substring(0, 35)} │
│ ${sentence.trim().length > 35 ? sentence.trim().substring(35, 70) : ""}│
│                                     │
${
  isDialogue
    ? `│  ╭─────────────────────────╮       │
│  │ ${sentence.match(/"([^"]*)"/)?.[1]?.substring(0, 20) || "Dialogue here"} │
│  ╰─────────────────────────╯       │`
    : "│                                     │"
}
└─────────────────────────────────────┘`;
        })
        .join("\n");

      return `🎨 COMIC BOOK FORMAT
      
${title.toUpperCase()}
Issue #1

${panels}`;
    },

    screenplay: (text, title = "Your Story") => {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const hasDialogue = text.includes('"') || text.includes("'");

      let script = `📽️ SCREENPLAY FORMAT


                    ${title.toUpperCase()}

                         Written by
                      
                      You & Aura


FADE IN:

INT. SCENE - DAY

${sentences[0]?.trim()}

`;

      if (hasDialogue) {
        const dialogue = text.match(/"([^"]*)"/)?.[1];
        script += `
                    CHARACTER
     ${dialogue || "Your dialogue here"}
`;
      }

      sentences.slice(1, 3).forEach((sentence) => {
        script += `
${sentence.trim()}

`;
      });

      script += `
FADE OUT.`;

      return script;
    },

    novel: (text, title = "Your Story") => {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const paragraphs = [];

      for (let i = 0; i < sentences.length; i += 3) {
        const para = sentences.slice(i, i + 3).join(" ");
        paragraphs.push(`     ${para}`);
      }

      return `📖 NOVEL FORMAT

CHAPTER ONE
${title}

${paragraphs.join("\n     \n")}`;
    },
  },
};

// Main Aura Demo System
const DemoStorySystem = ({ onExit }) => {
  const [messages, setMessages] = useState([]);
  const [currentStage, setCurrentStage] = useState("welcome");
  const [isAuraTyping, setIsAuraTyping] = useState(false);
  const [isAuraThinking, setIsAuraThinking] = useState(false);
  const [awaitingInput, setAwaitingInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [userData, setUserData] = useState({
    name: "",
    story: "",
    genre: "",
    format: "",
    analysis: null,
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // NEW: prevent StrictMode double-run of the intro
  const startedRef = useRef(false);
  // NEW: keep track of timers so we can clear them on unmount
  const timersRef = useRef([]);

  const pushTimer = (t) => {
    timersRef.current.push(t);
    return t;
  };

  const uniqueId = (prefix = "m") =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start the demo (guarded)
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      startConversation();
    }

    return () => {
      // IMPORTANT: reset for StrictMode remount so startConversation runs again
      startedRef.current = false;

      // clear timers from this mount
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  // Add Aura message with typing effect (stable id + tracked timer)
  const addAuraMessage = (text, callback) => {
    const messageId = uniqueId("aura");
    setIsAuraTyping(true);

    setMessages((prev) => [
      ...prev,
      { id: messageId, type: "aura", content: text, isTyping: true },
    ]);

    const typingTime = Math.min(text.length * 30, 4000);
    pushTimer(
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isTyping: false } : m))
        );
        setIsAuraTyping(false);
        if (callback) callback();
      }, typingTime)
    );
  };

  // Add user message (stable id)
  const addUserMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      { id: uniqueId("user"), type: "user", content: text },
    ]);
  };

  // Thinking indicator (tracked timer)
  const showThinking = (duration = 2000, callback) => {
    setIsAuraThinking(true);
    pushTimer(
      setTimeout(() => {
        setIsAuraThinking(false);
        if (callback) callback();
      }, duration)
    );
  };

  const startConversation = () => {
    pushTimer(
      setTimeout(() => {
        addAuraMessage(auraResponses.welcome, () => {
          setAwaitingInput(true);
          pushTimer(setTimeout(() => inputRef.current?.focus(), 100));
        });
      }, 500)
    );
  };

  const handleUserInput = () => {
    const input = inputValue.trim();
    if (!input) return;

    addUserMessage(input);
    setInputValue("");
    setAwaitingInput(false);

    switch (currentStage) {
      case "welcome":
        handleNameInput(input);
        break;
      case "story_input":
        handleStoryInput(input);
        break;
      case "genre_selection":
        handleGenreSelection(input);
        break;
      case "format_selection":
        handleFormatSelection(input);
        break;
      default:
        break;
    }
  };

  const handleNameInput = (name) => {
    setUserData((prev) => ({ ...prev, name }));

    showThinking(1500, () => {
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
                    inputRef.current?.focus();
                  });
                }, 800)
              );
            });
          }, 600)
        );
      });
    });
  };

  const handleStoryInput = (story) => {
    if (story.length < 20) {
      addAuraMessage(
        "That's a bit short! Could you add a bit more detail? Even just a sentence or two more would help! 😊",
        () => {
          setAwaitingInput(true);
          inputRef.current?.focus();
        }
      );
      return;
    }

    const analysis = writingAssistant.analyzeStory(story);
    setUserData((prev) => ({ ...prev, story, analysis }));

    showThinking(2000, () => {
      addAuraMessage(auraResponses.analyzing, () => {
        pushTimer(
          setTimeout(() => {
            addAuraMessage(auraResponses.genreQuestion, () => {
              setCurrentStage("genre_selection");
              // stable id for options
              pushTimer(
                setTimeout(() => {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: uniqueId("opts"),
                      type: "options",
                      content: [
                        {
                          value: "scifi",
                          label: "🚀 Science Fiction",
                          desc: "Technology, space, future",
                        },
                        {
                          value: "fantasy",
                          label: "🐉 Fantasy",
                          desc: "Magic, mythical worlds",
                        },
                        {
                          value: "mystery",
                          label: "🔍 Mystery",
                          desc: "Puzzles, suspense",
                        },
                      ],
                    },
                  ]);
                }, 500)
              );
            });
          }, 600)
        );
      });
    });
  };

  const handleGenreSelection = (genre) => {
    if (isAuraTyping || isAuraThinking) return; // guard double-clicks
    setUserData((prev) => ({ ...prev, genre }));

    const genreLabel = genre === "scifi" ? "science fiction" : genre;

    showThinking(1500, () => {
      addAuraMessage(auraResponses.formatQuestion(genreLabel), () => {
        setCurrentStage("format_selection");
        pushTimer(
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: uniqueId("opts"),
                type: "options",
                content: [
                  {
                    value: "comic",
                    label: "🎨 Comic Book",
                    desc: "Visual panels with dialogue",
                  },
                  {
                    value: "screenplay",
                    label: "📽️ Screenplay",
                    desc: "Professional script format",
                  },
                  {
                    value: "novel",
                    label: "📖 Novel",
                    desc: "Traditional narrative prose",
                  },
                ],
              },
            ]);
          }, 500)
        );
      });
    });
  };

  const handleFormatSelection = (format) => {
    if (isAuraTyping || isAuraThinking) return; // guard double-clicks
    setUserData((prev) => ({ ...prev, format }));

    const formatLabel = format === "comic" ? "comic book" : format;

    showThinking(1000, () => {
      addAuraMessage(auraResponses.transforming(formatLabel), () => {
        showThinking(2500, () => {
          const transformed = writingAssistant.formatTransformers[format](
            userData.story,
            `${userData.name}'s Story`
          );

          addAuraMessage(auraResponses.presenting, () => {
            setMessages((prev) => [
              ...prev,
              { id: uniqueId("result"), type: "result", content: transformed },
            ]);

            pushTimer(
              setTimeout(() => {
                const tips = userData.analysis?.tips?.map(
                  (tip) => auraResponses.tips[tip]
                );
                if (tips && tips.length > 0) {
                  const allTips =
                    "Here are some personalized writing tips for you:\n\n" +
                    tips.join(" ");
                  addAuraMessage(allTips, () => {
                    pushTimer(
                      setTimeout(() => {
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: uniqueId("actions"),
                            type: "actions",
                            content: [
                              {
                                action: "try_another",
                                label: "Try Another Format",
                              },
                              { action: "new_story", label: "Write New Story" },
                              {
                                action: "exit",
                                label: "Start Full Version ✨",
                              },
                            ],
                          },
                        ]);
                      }, 1000)
                    );
                  });
                }
              }, 1000)
            );
          });
        });
      });
    });
  };

  const handleOptionClick = (value) => {
    if (isAuraTyping || isAuraThinking) return; // prevent rapid double fires
    setMessages((prev) => {
      const filtered = prev.filter((m) => m.type !== "options");
      return [
        ...filtered,
        { id: uniqueId("user"), type: "user", content: value },
      ];
    });

    if (currentStage === "genre_selection") {
      handleGenreSelection(value);
    } else if (currentStage === "format_selection") {
      handleFormatSelection(value);
    }
  };

  const handleActionClick = (action) => {
    if (isAuraTyping || isAuraThinking) return;
    if (action === "exit") {
      onExit?.();
      return;
    }
    if (action === "try_another") {
      setMessages([]);
      setCurrentStage("format_selection");
      addAuraMessage("Let's try a different format for your story!", () => {
        handleGenreSelection(userData.genre);
      });
      return;
    }
    if (action === "new_story") {
      setMessages([]);
      setUserData({
        name: userData.name,
        story: "",
        genre: "",
        format: "",
        analysis: null,
      });
      setCurrentStage("story_prompt");
      addAuraMessage(
        `Alright ${userData.name}, let's write something new!`,
        () => {
          addAuraMessage(auraResponses.storyPrompt, () => {
            setCurrentStage("story_input");
            setAwaitingInput(true);
            inputRef.current?.focus();
          });
        }
      );
    }
  };

  return (
    <>
      <style>{`
        @keyframes blink { 0%, 60% { opacity: 1; } 61%, 100% { opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>

      {/* Messages */}
      <div style={{ marginBottom: awaitingInput ? "80px" : "20px" }}>
        {messages.map((message) => (
          <div key={message.id} style={{ marginBottom: "16px" }}>
            {message.type === "aura" && (
              <div style={{ color: "#2c3e50" }}>
                <span style={{ color: "#667eea", fontWeight: "600" }}>
                  Aura:{" "}
                </span>
                {message.isTyping ? (
                  <TypingText text={message.content} />
                ) : (
                  message.content
                )}
              </div>
            )}

            {message.type === "user" && (
              <div style={{ color: "#64748b", fontStyle: "italic" }}>
                <span style={{ fontWeight: "600" }}>You: </span>
                {message.content}
              </div>
            )}

            {message.type === "options" && (
              <div style={{ marginTop: "12px" }}>
                {message.content.map((option, i) => (
                  <button
                    key={`${message.id}-${i}`}
                    onClick={() => handleOptionClick(option.value)}
                    disabled={isAuraTyping || isAuraThinking}
                    style={{
                      display: "block",
                      width: "100%",
                      marginBottom: "8px",
                      padding: "10px 14px",
                      background: "white",
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                      cursor:
                        isAuraTyping || isAuraThinking
                          ? "not-allowed"
                          : "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                      fontFamily: "inherit",
                      opacity: isAuraTyping || isAuraThinking ? 0.6 : 1,
                      pointerEvents:
                        isAuraTyping || isAuraThinking ? "none" : "auto",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#667eea";
                      e.currentTarget.style.background =
                        "rgba(102, 126, 234, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.background = "white";
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "14px",
                        marginBottom: "2px",
                      }}
                    >
                      {option.label}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      {option.desc}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {message.type === "result" && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "16px",
                  background: "rgba(102, 126, 234, 0.02)",
                  border: "1px solid rgba(102, 126, 234, 0.2)",
                  borderRadius: "4px",
                  whiteSpace: "pre-wrap",
                  fontSize: "13px",
                  lineHeight: "1.8",
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
              >
                {message.content}
              </div>
            )}

            {message.type === "actions" && (
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                {message.content.map((action, i) => (
                  <button
                    key={`${message.id}-${i}`}
                    onClick={() => handleActionClick(action.action)}
                    disabled={isAuraTyping || isAuraThinking}
                    style={{
                      padding: "8px 16px",
                      background:
                        action.action === "exit"
                          ? "#10b981"
                          : action.action === "try_another"
                          ? "white"
                          : "#667eea",
                      color:
                        action.action === "try_another" ? "#667eea" : "white",
                      border:
                        action.action === "try_another"
                          ? "1px solid #667eea"
                          : "none",
                      borderRadius: "4px",
                      cursor:
                        isAuraTyping || isAuraThinking
                          ? "not-allowed"
                          : "pointer",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      opacity: isAuraTyping || isAuraThinking ? 0.7 : 1,
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isAuraThinking && <AuraThinking />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {awaitingInput && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "100px",
            right: "60px",
            display: "flex",
            gap: "8px",
            alignItems: "flex-end",
            background: "rgba(255, 255, 255, 0.95)",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            backdropFilter: "blur(10px)",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isAuraTyping) {
                e.preventDefault();
                handleUserInput();
              }
            }}
            placeholder={
              currentStage === "welcome"
                ? "Enter your name..."
                : currentStage === "story_input"
                ? "Write your story idea..."
                : "Type your response..."
            }
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "inherit",
              fontSize: "14px",
              color: "#2c3e50",
            }}
            disabled={isAuraTyping}
          />
          <button
            onClick={handleUserInput}
            disabled={!inputValue.trim() || isAuraTyping}
            style={{
              padding: "8px 16px",
              background:
                inputValue.trim() && !isAuraTyping ? "#667eea" : "#e2e8f0",
              color: inputValue.trim() && !isAuraTyping ? "white" : "#94a3b8",
              border: "none",
              borderRadius: "4px",
              cursor:
                inputValue.trim() && !isAuraTyping ? "pointer" : "not-allowed",
              fontSize: "14px",
              fontFamily: "inherit",
            }}
          >
            Send
          </button>
        </div>
      )}
    </>
  );
};

export { DemoStorySystem };
