import React, { useState, useRef, useEffect } from 'react';

function App() {
  const [currentStep, setCurrentStep] = useState('landing');
  const [messages, setMessages] = useState([]);
  const [currentTyping, setCurrentTyping] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [awaitingInput, setAwaitingInput] = useState(false);
  const [currentStage, setCurrentStage] = useState('welcome');
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [userStory, setUserStory] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const typingInProgressRef = useRef(null);
  const lastProcessedIndexRef = useRef(0);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentTyping]);

  // Cursor blinking
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // Initialize conversation when moving from landing
  useEffect(() => {
    if (currentStep === 'conversation') {
      setTimeout(() => {
        addSystemMessage("Hello there! Welcome to your personal storytelling notebook. ✨");
        setTimeout(() => {
          addSystemMessage("I'm here to help you transform your ideas into amazing stories.");
          setTimeout(() => {
            addSystemMessage("What type of story would you like to create today?");
            setTimeout(() => {
              addSystemMessage("📖 Book - A rich narrative with detailed characters");
              setTimeout(() => {
                addSystemMessage("💭 Comic - Visual storytelling with panels and dialogue");
                setTimeout(() => {
                  addSystemMessage("🎬 Screenplay - Scene-by-scene breakdown for film");
                  setTimeout(() => {
                    addSystemMessage("📝 Content - Engaging blog post or article");
                    setTimeout(() => {
                      setAwaitingInput(true);
                      addInputPrompt("Type your choice (book, comic, screenplay, or content)...");
                    }, 1000);
                  }, 800);
                }, 800);
              }, 800);
            }, 800);
          }, 1000);
        }, 1000);
      }, 500);
    }
  }, [currentStep]);

  const handleLetsBegin = () => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentStep('conversation');
      setIsTransitioning(false);
    }, 1200);
  };

  const typeMessage = async (text, callback) => {
    if (typingInProgressRef.current) return;
    
    typingInProgressRef.current = true;
    setIsTyping(true);
    setCurrentTyping('');
    
    for (let i = 0; i <= text.length; i++) {
      if (!typingInProgressRef.current) break;
      setCurrentTyping(text.slice(0, i));
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    typingInProgressRef.current = false;
    setIsTyping(false);
    setCurrentTyping('');
    
    if (callback) callback();
  };

  const addSystemMessage = (text) => {
    return new Promise((resolve) => {
      typeMessage(text, () => {
        setMessages(prev => [...prev, { type: 'system', content: text, timestamp: Date.now() }]);
        resolve();
      });
    });
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { type: 'user', content: text, timestamp: Date.now() }]);
  };

  const addInputPrompt = (placeholder) => {
    setMessages(prev => [...prev, { type: 'input', placeholder, timestamp: Date.now() }]);
  };

  const addLoadingMessage = (text) => {
    setMessages(prev => [...prev, { type: 'loading', content: text, timestamp: Date.now() }]);
  };

  const handleUserSubmit = async () => {
    if (!userInput.trim() || !awaitingInput) return;
    
    const input = userInput.trim();
    addUserMessage(input);
    setUserInput('');
    setAwaitingInput(false);

    // Remove the input prompt
    setMessages(prev => prev.filter(msg => msg.type !== 'input'));

    // Process based on current stage
    if (currentStage === 'welcome') {
      await handleStoryTypeSelection(input);
    } else if (currentStage === 'storytelling') {
      await handleStorySubmission(input);
    } else if (currentStage === 'choice') {
      await handleChoiceSelection(input);
    }
  };

  const handleStoryTypeSelection = async (input) => {
    const lowerInput = input.toLowerCase();
    let selectedType = null;
    
    if (lowerInput.includes('book') || lowerInput.includes('novel')) {
      selectedType = 'book';
    } else if (lowerInput.includes('comic') || lowerInput.includes('manga')) {
      selectedType = 'comic';
    } else if (lowerInput.includes('screenplay') || lowerInput.includes('script')) {
      selectedType = 'screenplay';
    } else if (lowerInput.includes('content') || lowerInput.includes('blog')) {
      selectedType = 'content';
    }

    if (selectedType) {
      setSelectedStyle(selectedType);
      setCurrentStage('storytelling');
      
      await new Promise(resolve => setTimeout(resolve, 800));
      await addSystemMessage(`Perfect! Let's create your ${selectedType}. 📚`);
      await new Promise(resolve => setTimeout(resolve, 800));
      await addSystemMessage("Tell me your story - you can type it out below.");
      await new Promise(resolve => setTimeout(resolve, 800));
      await addSystemMessage("🎤 You can also use the microphone button to record your voice!");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setAwaitingInput(true);
      addInputPrompt(`Tell me your ${selectedType} story...`);
    } else {
      await new Promise(resolve => setTimeout(resolve, 500));
      await addSystemMessage("I didn't quite catch that. Please choose: book, comic, screenplay, or content.");
      setAwaitingInput(true);
      addInputPrompt("Type your choice...");
    }
  };

  const handleStorySubmission = async (input) => {
    if (input.length < 10) {
      await addSystemMessage("That's a bit short! Please tell me more about your story (at least 10 characters).");
      setAwaitingInput(true);
      addInputPrompt(`Continue your ${selectedStyle} story...`);
      return;
    }

    setUserStory(input);
    setCurrentStage('choice');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    await addSystemMessage("Wonderful! I can see your creative energy flowing. ✨");
    await new Promise(resolve => setTimeout(resolve, 800));
    await addSystemMessage("How would you like me to help you with this story?");
    await new Promise(resolve => setTimeout(resolve, 800));
    await addSystemMessage("✨ Enhance - I'll use AI magic to transform and improve it");
    await new Promise(resolve => setTimeout(resolve, 800));
    await addSystemMessage("✏️ Refine - You can make manual edits and improvements");
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setAwaitingInput(true);
    addInputPrompt("Type 'enhance' or 'refine'...");
  };

  const handleChoiceSelection = async (input) => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('enhance')) {
      await enhanceStory();
    } else if (lowerInput.includes('refine')) {
      await refineStory();
    } else {
      await addSystemMessage("Please choose 'enhance' or 'refine'.");
      setAwaitingInput(true);
      addInputPrompt("Type 'enhance' or 'refine'...");
    }
  };

  const enhanceStory = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await addSystemMessage("Excellent choice! Let me work my magic on your story... 🔮");
    
    addLoadingMessage("🔮 Analyzing your narrative structure...");
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    addLoadingMessage("✨ Enhancing characters and dialogue...");
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    addLoadingMessage("🎨 Polishing the final details...");
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await addSystemMessage("✨ Ta-da! Your story has been transformed!");
    await new Promise(resolve => setTimeout(resolve, 800));
    await addSystemMessage("═══════════════════════════════════════");
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const enhancedStory = `Enhanced ${selectedStyle}:

${userStory}

[This has been enhanced with improved narrative flow, richer character development, and more engaging dialogue. In a real implementation, this would be processed by AI to create a truly transformed version of your story.]`;
    
    await addSystemMessage(enhancedStory);
    await new Promise(resolve => setTimeout(resolve, 800));
    await addSystemMessage("═══════════════════════════════════════");
    await new Promise(resolve => setTimeout(resolve, 800));
    await addSystemMessage(`📊 ${userStory.split(' ').length} words of pure magic!`);
    await new Promise(resolve => setTimeout(resolve, 800));
    await addSystemMessage("🎉 Your story transformation is complete! You can scroll up to review the entire conversation anytime.");
  };

  const refineStory = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await addSystemMessage("Great choice! Let's refine your story together. ✏️");
    await new Promise(resolve => setTimeout(resolve, 800));
    await addSystemMessage("Here's your current story:");
    await new Promise(resolve => setTimeout(resolve, 800));
    await addSystemMessage(`"${userStory}"`);
    await new Promise(resolve => setTimeout(resolve, 800));
    await addSystemMessage("What would you like to change or improve?");
    
    setAwaitingInput(true);
    addInputPrompt("Describe what you'd like to refine...");
    setCurrentStage('refining');
  };

  // Speech recognition setup
  useEffect(() => {
    if (currentStep === 'conversation') {
      initSpeechRecognition();
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentStep]);

  const initSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      let newFinalTranscript = '';
      
      for (let i = lastProcessedIndexRef.current; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinalTranscript += transcript + ' ';
        }
      }
      
      lastProcessedIndexRef.current = event.results.length;
      
      if (newFinalTranscript.trim()) {
        setUserInput(prev => prev + newFinalTranscript);
      }
    };

    recognitionRef.current.onstart = () => {
      lastProcessedIndexRef.current = 0;
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    return true;
  };

  const toggleRecording = async () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
        recognitionRef.current?.start();
      } catch (error) {
        console.error('Microphone access denied:', error);
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: currentStep === 'landing' 
        ? 'linear-gradient(135deg, #4c5aa7 0%, #5a4a7a 100%)'
        : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      perspective: '1000px',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: "'Kalam', cursive",
      transition: 'background 1.2s ease'
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Special+Elite&display=swap');
          
          @keyframes gentleFloat {
            0%, 100% { 
              transform: translateY(0px) rotateX(2deg) rotateY(-1deg);
            }
            50% { 
              transform: translateY(-8px) rotateX(-1deg) rotateY(1deg);
            }
          }

          @keyframes blink {
            0%, 60% { opacity: 1; }
            61%, 100% { opacity: 0; }
          }

          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.8;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes floatUp {
            0% { 
              opacity: 0;
              transform: translateY(0px) scale(0);
            }
            10% {
              opacity: 1;
              transform: translateY(-10px) scale(1);
            }
            90% {
              opacity: 1;
              transform: translateY(-100vh) scale(1);
            }
            100% { 
              opacity: 0;
              transform: translateY(-100vh) scale(0);
            }
          }

          /* Hide scrollbars completely */
          .scrollable-content {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* Internet Explorer 10+ */
          }
          
          .scrollable-content::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none; /* WebKit browsers */
          }

          .loading-dot {
            animation: pulse 1.5s ease-in-out infinite;
          }

          .play-icon {
            width: 0;
            height: 0;
            border-left: 12px solid currentColor;
            border-top: 8px solid transparent;
            border-bottom: 8px solid transparent;
            margin-left: 3px;
          }

          .stop-icon {
            width: 14px;
            height: 14px;
            background: currentColor;
            border-radius: 2px;
          }

          .lets-begin-button:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
            background: rgba(255, 255, 255, 0.25) !important;
          }
        `}
      </style>

      {/* LANDING PAGE */}
      {currentStep === 'landing' && (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center',
          padding: '40px 20px',
          position: 'relative',
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'scale(0.95) translateY(20px)' : 'scale(1) translateY(0)',
          transition: 'all 1.2s cubic-bezier(0.23, 1, 0.32, 1)',
          width: '100%'
        }}>
          {/* Floating particles */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}>
            {[...Array(7)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: `${4 + i}px`,
                height: `${4 + i}px`,
                background: 'rgba(255, 255, 255, 0.6)',
                borderRadius: '50%',
                left: `${10 + i * 13}%`,
                bottom: '-10px',
                animation: `floatUp ${8 + i * 2}s ease-in-out infinite`,
                animationDelay: `${i}s`,
                opacity: 0
              }} />
            ))}
          </div>

          <h1 style={{
            fontSize: '4.5rem',
            fontWeight: '800',
            marginBottom: '24px',
            background: 'linear-gradient(45deg, #ffffff, #e0e7ff)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            AuraMythos.ai
          </h1>
          <h5 style={{
            fontSize: '1.2rem',
            fontWeight: '300',
            marginBottom: '48px',
            color: 'rgba(255, 255, 255, 0.9)',
            maxWidth: '600px',
            lineHeight: '1.6'
          }}>
            Turn your ideas into fully realized stories, just like magic. <strong>Simply speak it, and watch AuraMythos give it life.</strong>
          </h5>
          
          <button 
            className="lets-begin-button"
            style={{
              padding: '18px 48px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '50px',
              color: 'white',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden',
              transform: 'translateY(0)'
            }}
            onClick={handleLetsBegin}
          >
            Let's Begin
          </button>
        </div>
      )}

      {/* CONVERSATION INTERFACE */}
      {currentStep === 'conversation' && (
        <div style={{
          position: 'relative',
          transformStyle: 'preserve-3d',
          animation: 'gentleFloat 6s ease-in-out infinite'
        }}>
          <div style={{
            width: '700px',
            height: '800px',
            background: '#fefefe',
            position: 'relative',
            boxShadow: `
              0 25px 50px rgba(0,0,0,0.1),
              0 5px 15px rgba(0,0,0,0.05),
              inset 0 1px 0 rgba(255,255,255,0.9)
            `,
            borderRadius: '3px',
            transform: 'rotateX(5deg) rotateY(-2deg)',
            transition: 'transform 0.3s ease'
          }}>
            {/* Paper Lines */}
            <div style={{
              position: 'absolute',
              top: '80px',
              left: 0,
              right: 0,
              bottom: '40px',
              backgroundImage: `repeating-linear-gradient(
                transparent,
                transparent 27px,
                #e8f4fd 27px,
                #e8f4fd 28px
              )`,
              pointerEvents: 'none'
            }} />
            
            {/* Paper Margin */}
            <div style={{
              position: 'absolute',
              left: '80px',
              top: 0,
              width: '2px',
              height: '100%',
              background: '#ffb3ba',
              opacity: 0.6,
              pointerEvents: 'none'
            }} />

            {/* SCROLLABLE CONVERSATION */}
            <div 
              className="scrollable-content"
              style={{
                position: 'absolute',
                top: '100px',
                left: '100px',
                right: '60px',
                bottom: awaitingInput ? '120px' : '40px',
                fontFamily: "'Special Elite', 'Courier New', monospace",
                fontSize: '16px',
                lineHeight: '1.8',
                color: '#2c3e50',
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollBehavior: 'smooth'
              }}>
              {/* All messages */}
              {messages.map((message, index) => {
                if (message.type === 'system') {
                  return (
                    <div key={index} style={{
                      marginBottom: '12px',
                      lineHeight: '1.8',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {message.content}
                    </div>
                  );
                }
                
                if (message.type === 'user') {
                  return (
                    <div key={index} style={{
                      marginBottom: '12px',
                      marginLeft: '20px',
                      color: '#667eea',
                      fontStyle: 'italic',
                      lineHeight: '1.8'
                    }}>
                      > {message.content}
                    </div>
                  );
                }
                
                if (message.type === 'loading') {
                  return (
                    <div key={index} style={{
                      marginBottom: '12px',
                      color: '#9ca3af',
                      lineHeight: '1.8'
                    }}>
                      <span className="loading-dot">{message.content}</span>
                    </div>
                  );
                }
                
                return null;
              })}
              
              {/* Currently typing */}
              {isTyping && (
                <div style={{
                  marginBottom: '12px',
                  lineHeight: '1.8'
                }}>
                  {currentTyping}
                  {showCursor && (
                    <span style={{
                      display: 'inline-block',
                      width: '2px',
                      height: '20px',
                      background: '#667eea',
                      marginLeft: '2px',
                      animation: 'blink 1s infinite'
                    }} />
                  )}
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA WITH SUBMIT BUTTON */}
            {awaitingInput && (
              <div style={{
                position: 'absolute',
                bottom: '40px',
                left: '100px',
                right: '60px',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <textarea
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontFamily: "'Special Elite', 'Courier New', monospace",
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: '#2c3e50',
                    resize: 'none',
                    minHeight: '24px',
                    maxHeight: '120px'
                  }}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={messages.find(m => m.type === 'input')?.placeholder || "Type your response..."}
                />
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {currentStage === 'storytelling' && (
                    <button
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '1px solid rgba(183, 173, 235, 0.3)',
                        cursor: 'pointer',
                        background: isRecording 
                          ? 'rgba(155, 144, 210, 0.4)' 
                          : 'rgba(183, 173, 235, 0.25)',
                        backdropFilter: 'blur(20px)',
                        color: 'rgba(110, 99, 158, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}
                      onClick={toggleRecording}
                      title={isRecording ? "Stop Recording" : "Start Recording"}
                    >
                      {isRecording ? <div className="stop-icon"></div> : <div className="play-icon"></div>}
                    </button>
                  )}
                  
                  <button
                    style={{
                      padding: '8px 16px',
                      background: userInput.trim() 
                        ? 'rgba(183, 173, 235, 0.8)' 
                        : 'rgba(183, 173, 235, 0.3)',
                      border: '1px solid rgba(183, 173, 235, 0.4)',
                      borderRadius: '6px',
                      color: userInput.trim() ? '#2c3e50' : 'rgba(110, 99, 158, 0.6)',
                      cursor: userInput.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(10px)'
                    }}
                    onClick={handleUserSubmit}
                    disabled={!userInput.trim()}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;