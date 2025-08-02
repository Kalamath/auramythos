import React, { useState, useRef, useEffect } from 'react';

function App() {
  // Core app state
  const [appState, setAppState] = useState({
    currentStep: 'landing',
    currentStage: 'welcome',
    isTransitioning: false,
    selectedStyle: null
  });

  // Conversation state
  const [conversationState, setConversationState] = useState({
    messages: [],
    currentTyping: '',
    isTyping: false,
    awaitingInput: false,
    showCursor: true
  });

  // User content
  const [userContent, setUserContent] = useState({
    input: '',
    story: ''
  });

  // Recording state
  const [recordingState, setRecordingState] = useState({
    isRecording: false
  });
  
  // Refs
  const refs = {
    messagesEnd: useRef(null),
    recognition: useRef(null),
    typingInProgress: useRef(null),
    lastProcessedIndex: useRef(0),
    messageQueue: useRef([]),
    isProcessingQueue: useRef(false)
  };

  // Helper functions to update grouped state
  const updateAppState = (updates) => {
    setAppState(prev => ({ ...prev, ...updates }));
  };

  const updateConversationState = (updates) => {
    setConversationState(prev => ({ ...prev, ...updates }));
  };

  const updateUserContent = (updates) => {
    setUserContent(prev => ({ ...prev, ...updates }));
  };

  const updateRecordingState = (updates) => {
    setRecordingState(prev => ({ ...prev, ...updates }));
  };
  const conversationIntro = [
    { text: "Hello there! Welcome to your personal storytelling notebook. ✨", delay: 500 },
    { text: "I'm here to help you transform your ideas into amazing stories.", delay: 1000 },
    { text: "What type of story would you like to create today?", delay: 1000 },
    { text: "📖 Book - A rich narrative with detailed characters", delay: 800 },
    { text: "💭 Comic - Visual storytelling with panels and dialogue", delay: 800 },
    { text: "🎬 Screenplay - Scene-by-scene breakdown for film", delay: 800 },
    { text: "📝 Content - Engaging blog post or article", delay: 800 },
    { type: 'input', placeholder: "Type your choice (book, comic, screenplay, or content)...", delay: 1000 }
  ];

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    refs.messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationState.messages, conversationState.currentTyping]);

  // Cursor blinking
  useEffect(() => {
    const interval = setInterval(() => {
      updateConversationState({ showCursor: !conversationState.showCursor });
    }, 600);
    return () => clearInterval(interval);
  }, [conversationState.showCursor]);

  // Initialize conversation when moving from landing
  useEffect(() => {
    if (appState.currentStep === 'conversation') {
      // Queue all intro messages
      refs.messageQueue.current = [...conversationIntro];
      processMessageQueue();
    }
  }, [appState.currentStep]);

  // Process message queue
  const processMessageQueue = async () => {
    if (refs.isProcessingQueue.current || refs.messageQueue.current.length === 0) return;
    
    refs.isProcessingQueue.current = true;
    
    while (refs.messageQueue.current.length > 0) {
      const message = refs.messageQueue.current.shift();
      
      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, message.delay || 0));
      
      // Process based on message type
      if (message.type === 'input') {
        updateConversationState({ awaitingInput: true });
        addInputPrompt(message.placeholder);
      } else if (message.isLoading) {
        addLoadingMessage(message.text);
      } else {
        await addSystemMessage(message.text);
      }
    }
    
    refs.isProcessingQueue.current = false;
  };

  // Add messages to queue
  const queueMessages = (messages) => {
    refs.messageQueue.current.push(...messages);
    processMessageQueue();
  };

  const handleLetsBegin = () => {
    updateAppState({ isTransitioning: true });
    
    setTimeout(() => {
      updateAppState({ 
        currentStep: 'conversation',
        isTransitioning: false 
      });
    }, 1200);
  };

  const typeMessage = async (text, callback) => {
    if (refs.typingInProgress.current) return;
    
    refs.typingInProgress.current = true;
    updateConversationState({ isTyping: true, currentTyping: '' });
    
    for (let i = 0; i <= text.length; i++) {
      if (!refs.typingInProgress.current) break;
      updateConversationState({ currentTyping: text.slice(0, i) });
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    refs.typingInProgress.current = false;
    updateConversationState({ isTyping: false, currentTyping: '' });
    
    if (callback) callback();
  };

  const addSystemMessage = (text) => {
    return new Promise((resolve) => {
      typeMessage(text, () => {
        setConversationState(prev => ({ 
          ...prev,
          messages: [...prev.messages, { type: 'system', content: text, timestamp: Date.now() }]
        }));
        resolve();
      });
    });
  };

  const addUserMessage = (text) => {
    setConversationState(prev => ({ 
      ...prev,
      messages: [...prev.messages, { type: 'user', content: text, timestamp: Date.now() }]
    }));
  };

  const addInputPrompt = (placeholder) => {
    setConversationState(prev => ({ 
      ...prev,
      messages: [...prev.messages, { type: 'input', placeholder, timestamp: Date.now() }]
    }));
  };

  const addLoadingMessage = (text) => {
    setConversationState(prev => ({ 
      ...prev,
      messages: [...prev.messages, { type: 'loading', content: text, timestamp: Date.now() }]
    }));
  };

  const handleUserSubmit = async () => {
    if (!userContent.input.trim() || !conversationState.awaitingInput) return;
    
    const input = userContent.input.trim();
    addUserMessage(input);
    updateUserContent({ input: '' });
    updateConversationState({ awaitingInput: false });

    // Remove the input prompt
    setConversationState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.type !== 'input')
    }));

    // Process based on current stage
    if (appState.currentStage === 'welcome') {
      await handleStoryTypeSelection(input);
    } else if (appState.currentStage === 'storytelling') {
      await handleStorySubmission(input);
    } else if (appState.currentStage === 'choice') {
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
      updateAppState({ 
        selectedStyle: selectedType,
        currentStage: 'storytelling' 
      });
      
      queueMessages([
        { text: `Perfect! Let's create your ${selectedType}. 📚`, delay: 800 },
        { text: "Tell me your story - you can type it out below.", delay: 800 },
        { text: "🎤 You can also use the microphone button to record your voice!", delay: 800 },
        { type: 'input', placeholder: `Tell me your ${selectedType} story...`, delay: 800 }
      ]);
    } else {
      queueMessages([
        { text: "I didn't quite catch that. Please choose: book, comic, screenplay, or content.", delay: 500 },
        { type: 'input', placeholder: "Type your choice...", delay: 0 }
      ]);
    }
  };

  const handleStorySubmission = async (input) => {
    if (input.length < 10) {
      queueMessages([
        { text: "That's a bit short! Please tell me more about your story (at least 10 characters).", delay: 0 },
        { type: 'input', placeholder: `Continue your ${appState.selectedStyle} story...`, delay: 0 }
      ]);
      return;
    }

    updateUserContent({ story: input });
    updateAppState({ currentStage: 'choice' });
    
    queueMessages([
      { text: "Wonderful! I can see your creative energy flowing. ✨", delay: 800 },
      { text: "How would you like me to help you with this story?", delay: 800 },
      { text: "✨ Enhance - I'll use AI magic to transform and improve it", delay: 800 },
      { text: "✏️ Refine - You can make manual edits and improvements", delay: 800 },
      { type: 'input', placeholder: "Type 'enhance' or 'refine'...", delay: 800 }
    ]);
  };

  const handleChoiceSelection = async (input) => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('enhance')) {
      await enhanceStory();
    } else if (lowerInput.includes('refine')) {
      await refineStory();
    } else {
      queueMessages([
        { text: "Please choose 'enhance' or 'refine'.", delay: 0 },
        { type: 'input', placeholder: "Type 'enhance' or 'refine'...", delay: 0 }
      ]);
    }
  };

  const enhanceStory = async () => {
    // Initial message
    await addSystemMessage("Excellent choice! Let me work my magic on your story... 🔮");
    
    // Loading messages sequence
    const loadingSequence = [
      { text: "🔮 Analyzing your narrative structure...", isLoading: true },
      { text: "✨ Enhancing characters and dialogue...", isLoading: true },
      { text: "🎨 Polishing the final details...", isLoading: true }
    ];
    
    for (const message of loadingSequence) {
      addLoadingMessage(message.text);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Clear loading messages
    setConversationState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.type !== 'loading')
    }));
    
    const enhancedStory = `Enhanced ${appState.selectedStyle}:

${userContent.story}

[This has been enhanced with improved narrative flow, richer character development, and more engaging dialogue. In a real implementation, this would be processed by AI to create a truly transformed version of your story.]`;
    
    queueMessages([
      { text: "✨ Ta-da! Your story has been transformed!", delay: 800 },
      { text: "═══════════════════════════════════════", delay: 500 },
      { text: enhancedStory, delay: 500 },
      { text: "═══════════════════════════════════════", delay: 500 },
      { text: `📊 ${userContent.story.split(' ').length} words of pure magic!`, delay: 800 },
      { text: "🎉 Your story transformation is complete! You can scroll up to review the entire conversation anytime.", delay: 800 }
    ]);
  };

  const refineStory = async () => {
    queueMessages([
      { text: "Great choice! Let's refine your story together. ✏️", delay: 500 },
      { text: "Here's your current story:", delay: 800 },
      { text: `"${userContent.story}"`, delay: 800 },
      { text: "What would you like to change or improve?", delay: 800 },
      { type: 'input', placeholder: "Describe what you'd like to refine...", delay: 0 }
    ]);
    
    updateAppState({ currentStage: 'refining' });
  };

  // Speech recognition setup
  useEffect(() => {
    if (appState.currentStep === 'conversation') {
      initSpeechRecognition();
    }
    return () => {
      if (refs.recognition.current) {
        refs.recognition.current.stop();
      }
    };
  }, [appState.currentStep]);

  const initSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    refs.recognition.current = new SpeechRecognition();
    refs.recognition.current.continuous = true;
    refs.recognition.current.interimResults = true;
    refs.recognition.current.lang = 'en-US';

    refs.recognition.current.onresult = (event) => {
      let newFinalTranscript = '';
      
      for (let i = refs.lastProcessedIndex.current; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinalTranscript += transcript + ' ';
        }
      }
      
      refs.lastProcessedIndex.current = event.results.length;
      
      if (newFinalTranscript.trim()) {
        updateUserContent(prev => ({ ...prev, input: prev.input + newFinalTranscript }));
      }
    };

    refs.recognition.current.onstart = () => {
      refs.lastProcessedIndex.current = 0;
    };

    refs.recognition.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      updateRecordingState({ isRecording: false });
    };

    refs.recognition.current.onend = () => {
      updateRecordingState({ isRecording: false });
    };

    return true;
  };

  const toggleRecording = async () => {
    if (recordingState.isRecording) {
      refs.recognition.current?.stop();
      updateRecordingState({ isRecording: false });
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        updateRecordingState({ isRecording: true });
        refs.recognition.current?.start();
      } catch (error) {
        console.error('Microphone access denied:', error);
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: appState.currentStep === 'landing' 
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

          .send-icon {
            position: relative;
            width: 18px;
            height: 18px;
          }

          .send-icon::before {
            content: '→';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 20px;
            font-weight: bold;
            line-height: 1;
          }
        `}
      </style>

      {/* LANDING PAGE */}
      {appState.currentStep === 'landing' && (
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
          opacity: appState.isTransitioning ? 0 : 1,
          transform: appState.isTransitioning ? 'scale(0.95) translateY(20px)' : 'scale(1) translateY(0)',
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
            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            AuraMythos.ai
          </h1>
          <h5 style={{
            fontSize: '1.2rem',
            fontWeight: '300',
            marginBottom: '48px',
            color: 'rgba(255, 255, 255, 0.9)',
            maxWidth: '600px',
            lineHeight: '1.6',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
      {appState.currentStep === 'conversation' && (
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
                bottom: conversationState.awaitingInput ? '120px' : '40px',
                fontFamily: "'Special Elite', 'Courier New', monospace",
                fontSize: '16px',
                lineHeight: '1.8',
                color: '#2c3e50',
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollBehavior: 'smooth'
              }}
            >
              {/* All messages */}
              {conversationState.messages.map((message, index) => {
                if (message.type === 'system') {
                  return (
                    <div key={index} style={{
                      marginBottom: '12px',
                      lineHeight: '1.8',
                      whiteSpace: 'pre-wrap',
                      minHeight: '28.8px'
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
                      lineHeight: '1.8',
                      minHeight: '28.8px'
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
                      lineHeight: '1.8',
                      minHeight: '28.8px'
                    }}>
                      <span className="loading-dot">{message.content}</span>
                    </div>
                  );
                }
                
                return null;
              })}
              
              {/* Currently typing */}
              {conversationState.isTyping && (
                <div style={{
                  marginBottom: '12px',
                  lineHeight: '1.8',
                  minHeight: '28.8px' // 1.8 * 16px font size
                }}>
                  {conversationState.currentTyping}
                  {conversationState.showCursor && (
                    <span style={{
                      display: 'inline-block',
                      width: '2px',
                      height: '20px',
                      background: '#667eea',
                      marginLeft: '2px',
                      verticalAlign: 'text-bottom'
                    }} />
                  )}
                </div>
              )}
              
              <div ref={refs.messagesEnd} />
            </div>

            {/* INPUT AREA WITH SEND ICON */}
            {conversationState.awaitingInput && (
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
                  value={userContent.input}
                  onChange={(e) => updateUserContent({ input: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.shiftKey) {
                      // Shift + Enter = Send message
                      e.preventDefault();
                      handleUserSubmit();
                    }
                    // Regular Enter = Line break (default textarea behavior)
                  }}
                  placeholder={conversationState.messages.find(m => m.type === 'input')?.placeholder || "Type your response... (Shift+Enter to send)"}
                />
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {appState.currentStage === 'storytelling' && (
                    <button
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '1px solid rgba(183, 173, 235, 0.3)',
                        cursor: 'pointer',
                        background: recordingState.isRecording 
                          ? 'rgba(155, 144, 210, 0.4)' 
                          : 'rgba(183, 173, 235, 0.25)',
                        backdropFilter: 'blur(20px)',
                        color: 'rgba(110, 99, 158, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={toggleRecording}
                      title={recordingState.isRecording ? "Stop Recording" : "Start Recording"}
                    >
                      {recordingState.isRecording ? <div className="stop-icon"></div> : <div className="play-icon"></div>}
                    </button>
                  )}
                  
                  <button
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: userContent.input.trim() 
                        ? 'rgba(183, 173, 235, 0.8)' 
                        : 'rgba(183, 173, 235, 0.3)',
                      border: '1px solid rgba(183, 173, 235, 0.4)',
                      color: userContent.input.trim() ? '#2c3e50' : 'rgba(110, 99, 158, 0.6)',
                      cursor: userContent.input.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '18px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: userContent.input.trim() 
                        ? '0 4px 20px rgba(183, 173, 235, 0.4)' 
                        : 'none'
                    }}
                    onClick={handleUserSubmit}
                    disabled={!userContent.input.trim()}
                    title="Send message (Shift+Enter)"
                  >
                    ↗
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