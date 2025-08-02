import React, { useState, useRef, useEffect } from 'react';

function App() {
  // Device detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkDevice = () => {
      // Check for screen width less than 768px or common mobile user agents
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Core app state
  const [appState, setAppState] = useState({
    currentStep: 'landing',
    currentStage: 'welcome',
    isTransitioning: false,
    selectedStyle: null,
    showNotebook: false
  });

  // Conversation state
  const [conversationState, setConversationState] = useState({
    messages: [],
    currentTyping: '',
    isTyping: false,
    awaitingInput: false,
    showCursor: true,
    inputJustAppeared: false
  });

  // User content
  const [userContent, setUserContent] = useState({
    input: '',
    story: '',
    branches: [],
    currentBranch: 'main'
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
    isProcessingQueue: useRef(false),
    textInput: useRef(null)
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

  // Message queue for typing animation
  const conversationIntro = [
    { text: "Hello there! Welcome to your personal storytelling notebook. ✨", delay: 500 },
    { text: "I'm here to help you transform your ideas into amazing stories.", delay: 1000 },
    { text: "What type of story would you like to create today?", delay: 1000 },
    { text: "📖 Book - A rich narrative with detailed characters", delay: 800 },
    { text: "💭 Comic - Visual storytelling with panels and dialogue", delay: 800 },
    { text: "🎬 Screenplay - Scene-by-scene breakdown for film", delay: 800 },
    { text: "📝 Content - Engaging blog post or article", delay: 800 },
    { text: "🎮 Game - Interactive narrative with player choices", delay: 800 },
    { text: "🌐 Interactive - Branching fiction with multiple endings", delay: 800 },
    { type: 'input', placeholder: "Type your choice (book, comic, screenplay, content, game, or interactive)...", delay: 1000 }
  ];

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    refs.messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Only scroll for desktop view, mobile handles its own ref
    if (!isMobile) {
      scrollToBottom();
    }
  }, [conversationState.messages, conversationState.currentTyping, isMobile]);

  // Auto-focus input when awaiting input
  useEffect(() => {
    if (conversationState.awaitingInput && refs.textInput.current) {
      setTimeout(() => {
        refs.textInput.current.focus();
        const length = refs.textInput.current.value.length;
        refs.textInput.current.setSelectionRange(length, length);
      }, 100);
    }
  }, [conversationState.awaitingInput]);

  // Cursor blinking
  useEffect(() => {
    const interval = setInterval(() => {
      updateConversationState({ showCursor: !conversationState.showCursor });
    }, 600);
    return () => clearInterval(interval);
  }, [conversationState.showCursor]);

  // Process message queue
  const processMessageQueue = async () => {
    if (refs.isProcessingQueue.current || refs.messageQueue.current.length === 0) return;
    
    refs.isProcessingQueue.current = true;
    
    while (refs.messageQueue.current.length > 0) {
      const message = refs.messageQueue.current.shift();
      
      await new Promise(resolve => setTimeout(resolve, message.delay || 0));
      
      if (message.type === 'input') {
        updateConversationState({ 
          awaitingInput: true,
          inputJustAppeared: true 
        });
        addInputPrompt(message.placeholder);
        setTimeout(() => {
          updateConversationState({ inputJustAppeared: false });
        }, 2000);
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
        showNotebook: false
      });
      
      setTimeout(() => {
        refs.messageQueue.current = [...conversationIntro];
        processMessageQueue();
        
        setTimeout(() => {
          updateAppState({ showNotebook: true });
          
          setTimeout(() => {
            updateAppState({ isTransitioning: false });
          }, 500);
        }, 200);
      }, 800);
    }, 1000);
  };

  const typeMessage = async (text, callback) => {
    if (refs.typingInProgress.current) return;
    
    refs.typingInProgress.current = true;
    updateConversationState({ isTyping: true, currentTyping: '' });
    
    for (let i = 0; i <= text.length; i++) {
      if (!refs.typingInProgress.current) break;
      updateConversationState({ currentTyping: text.slice(0, i) });
      await new Promise(resolve => setTimeout(resolve, isMobile ? 15 : 30)); // Faster typing on mobile
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

    setConversationState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.type !== 'input')
    }));

    if (appState.currentStage === 'welcome') {
      await handleStoryTypeSelection(input);
    } else if (appState.currentStage === 'storytelling') {
      await handleStorySubmission(input);
    } else if (appState.currentStage === 'choice') {
      await handleChoiceSelection(input);
    } else if (appState.currentStage === 'branching') {
      await handleBranchCreation(input);
    } else if (appState.currentStage === 'refining') {
      await handleRefinement(input);
    }
  };

  const handleBranchCreation = async (input) => {
    if (input.toLowerCase() === 'done') {
      queueMessages([
        { text: "🎉 Fantastic! Your interactive story is ready!", delay: 500 },
        { text: "You've created a dynamic narrative with player choices.", delay: 800 },
        { text: "In the full version, you'll be able to:", delay: 800 },
        { text: "• Export to game engines (Unity, Twine, Ren'Py)", delay: 600 },
        { text: "• Test different story paths", delay: 600 },
        { text: "• Add character stats and conditions", delay: 600 },
        { text: "Thank you for using AuraMythos! 🌟", delay: 800 }
      ]);
    } else {
      updateUserContent(prev => ({
        ...prev,
        branches: [...prev.branches, { 
          id: Date.now(), 
          description: input,
          choices: [] 
        }]
      }));
      
      queueMessages([
        { text: "Great choice point! Now let's add the options.", delay: 500 },
        { text: "What are the player's choices at this moment?", delay: 800 },
        { text: "Example: 'Choice A: Fight the dragon / Choice B: Negotiate with it'", delay: 800 },
        { type: 'input', placeholder: "Enter the choices (or type 'done' to finish)...", delay: 0 }
      ]);
    }
  };

  const handleRefinement = async (input) => {
    queueMessages([
      { text: "I understand! Let me help you refine that part.", delay: 500 },
      { text: `You want to improve: "${input}"`, delay: 800 },
      { text: "In the full version, I would provide specific suggestions and edits.", delay: 800 },
      { text: "For now, your story has been noted for refinement! ✏️", delay: 800 },
      { text: "Type 'enhance' to continue with AI enhancement, or 'done' to finish.", delay: 800 },
      { type: 'input', placeholder: "Type 'enhance' or 'done'...", delay: 0 }
    ]);
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
    } else if (lowerInput.includes('game') || lowerInput.includes('video game')) {
      selectedType = 'game';
    } else if (lowerInput.includes('interactive') || lowerInput.includes('choice')) {
      selectedType = 'interactive';
    }

    if (selectedType) {
      updateAppState({ 
        selectedStyle: selectedType,
        currentStage: 'storytelling' 
      });
      
      const isInteractive = ['game', 'interactive'].includes(selectedType);
      
      if (isInteractive) {
        queueMessages([
          { text: `Excellent! Let's create your ${selectedType === 'game' ? 'game narrative' : 'interactive story'}. 🎮`, delay: 800 },
          { text: "Tell me your main story concept - we'll add choices and branches next.", delay: 800 },
          { text: "🎤 You can also use the microphone button to record your ideas!", delay: 800 },
          { type: 'input', placeholder: `Describe your ${selectedType} story concept...`, delay: 800 }
        ]);
      } else {
        queueMessages([
          { text: `Perfect! Let's create your ${selectedType}. 📚`, delay: 800 },
          { text: "Tell me your story - you can type it out below.", delay: 800 },
          { text: "🎤 You can also use the microphone button to record your voice!", delay: 800 },
          { type: 'input', placeholder: `Tell me your ${selectedType} story...`, delay: 800 }
        ]);
      }
    } else {
      queueMessages([
        { text: "I didn't quite catch that. Please choose: book, comic, screenplay, content, game, or interactive.", delay: 500 },
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
    
    const isInteractive = ['game', 'interactive'].includes(appState.selectedStyle);
    
    if (isInteractive) {
      queueMessages([
        { text: "Great concept! I can see the potential for player engagement. 🎮", delay: 800 },
        { text: "How would you like me to help you develop this?", delay: 800 },
        { text: "✨ Enhance - I'll expand your story with rich details", delay: 800 },
        { text: "🌿 Branches - Let's create player choices and story branches", delay: 800 },
        { text: "✏️ Refine - You can make manual edits first", delay: 800 },
        { type: 'input', placeholder: "Type 'enhance', 'branches', or 'refine'...", delay: 800 }
      ]);
    } else {
      queueMessages([
        { text: "Wonderful! I can see your creative energy flowing. ✨", delay: 800 },
        { text: "How would you like me to help you with this story?", delay: 800 },
        { text: "✨ Enhance - I'll use AI magic to transform and improve it", delay: 800 },
        { text: "✏️ Refine - You can make manual edits and improvements", delay: 800 },
        { type: 'input', placeholder: "Type 'enhance' or 'refine'...", delay: 800 }
      ]);
    }
  };

  const handleChoiceSelection = async (input) => {
    const lowerInput = input.toLowerCase();
    const isInteractive = ['game', 'interactive'].includes(appState.selectedStyle);
    
    if (lowerInput.includes('enhance')) {
      await enhanceStory();
    } else if (lowerInput.includes('refine')) {
      await refineStory();
    } else if (isInteractive && lowerInput.includes('branch')) {
      await createBranches();
    } else {
      const choices = isInteractive 
        ? "Please choose 'enhance', 'refine', or 'branches'."
        : "Please choose 'enhance' or 'refine'.";
      queueMessages([
        { text: choices, delay: 0 },
        { type: 'input', placeholder: "Type your choice...", delay: 0 }
      ]);
    }
  };

  const enhanceStory = async () => {
    await addSystemMessage("Excellent choice! Let me work my magic on your story... 🔮");
    
    const loadingSequence = [
      { text: "🔮 Analyzing your narrative structure...", isLoading: true },
      { text: "✨ Enhancing characters and dialogue...", isLoading: true },
      { text: "🎨 Polishing the final details...", isLoading: true }
    ];
    
    for (const message of loadingSequence) {
      addLoadingMessage(message.text);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    setConversationState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.type !== 'loading')
    }));
    
    const isInteractive = ['game', 'interactive'].includes(appState.selectedStyle);
    const enhancedStory = `Enhanced ${appState.selectedStyle}:

${userContent.story}

[This has been enhanced with improved narrative flow, richer character development, and more engaging dialogue. In a real implementation, this would be processed by AI to create a truly transformed version of your story.]`;
    
    queueMessages([
      { text: "✨ Ta-da! Your story has been transformed!", delay: 800 },
      { text: "═══════════════════════════════════════", delay: 500 },
      { text: enhancedStory, delay: 500 },
      { text: "═══════════════════════════════════════", delay: 500 },
      { text: `📊 ${userContent.story.split(' ').length} words of pure magic!`, delay: 800 },
      { text: isInteractive 
        ? "🎮 Ready to add player choices? Type 'branches' to create interactive paths!" 
        : "🎉 Your story transformation is complete! You can scroll up to review the entire conversation anytime.", 
        delay: 800 
      }
    ]);
    
    if (isInteractive) {
      queueMessages([
        { type: 'input', placeholder: "Type 'branches' to add choices, or 'done' to finish...", delay: 800 }
      ]);
      updateAppState({ currentStage: 'branching' });
    }
  };

  const createBranches = async () => {
    updateAppState({ currentStage: 'branching' });
    
    await addSystemMessage("🌿 Let's create branching paths for your story!");
    
    const branchExample = `
Here's a simple branching structure for your ${appState.selectedStyle}:

📍 Main Story Point:
"${userContent.story.substring(0, 100)}..."

Player Choice:
  └─ [A] Take the mysterious path
      └─ Leads to: Discovery of ancient artifact
      └─ Consequence: Gain magical abilities
  
  └─ [B] Stay on the safe road  
      └─ Leads to: Meeting a traveling merchant
      └─ Consequence: Acquire useful information

Would you like to create your own choice points?`;
    
    queueMessages([
      { text: branchExample, delay: 1000 },
      { text: "I can help you map out:", delay: 800 },
      { text: "• Player decision points", delay: 600 },
      { text: "• Different story outcomes", delay: 600 },
      { text: "• Character dialogue variations", delay: 600 },
      { text: "What's your first major choice point in the story?", delay: 800 },
      { type: 'input', placeholder: "Describe a moment where the player makes a choice...", delay: 0 }
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
      // console.warn('Speech Recognition not supported in this browser.'); // For debugging
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
        // Request microphone access
        await navigator.mediaDevices.getUserMedia({ audio: true });
        updateRecordingState({ isRecording: true });
        refs.recognition.current?.start();
      } catch (error) {
        console.error('Microphone access denied:', error);
        // Optionally, inform the user about the denial
      }
    }
  };

  // Add console log for debugging
  useEffect(() => {
    console.log('Mobile mode:', isMobile ? 'Yes' : 'No');
  }, [isMobile]);

  // Determine main container background based on step and device
  const mainBackground = appState.currentStep === 'landing' 
    ? 'linear-gradient(135deg, #4c5aa7 0%, #5a4a7a 100%)'
    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'; // Background for the "paper" area

  // Determine the 'paper' styling
  const paperStyles = {
    background: '#fefefe',
    position: 'relative',
    boxShadow: `
      0 25px 50px rgba(0,0,0,0.1),
      0 5px 15px rgba(0,0,0,0.05),
      inset 0 1px 0 rgba(255,255,255,0.9)
    `,
    borderRadius: '3px',
    // Paper Lines
    backgroundImage: `repeating-linear-gradient(
      transparent,
      transparent 27px,
      #e8f4fd 27px,
      #e8f4fd 28px
    )`,
    // Paper Margin
    '--margin-left': isMobile ? '40px' : '80px', // Adjusted margin for mobile
    '--line-color': '#ffb3ba',
    '--line-opacity': 0.6,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: mainBackground,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      perspective: '1000px',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: "'Kalam', cursive",
      transition: 'background 1.2s ease'
    }}>
      {/* White transition overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'white',
        zIndex: 10,
        opacity: appState.isTransitioning ? 1 : 0,
        transition: appState.isTransitioning 
          ? 'opacity 0.6s ease-in'
          : 'opacity 0.8s ease-out',
        pointerEvents: 'none',
        visibility: appState.isTransitioning || appState.currentStep === 'landing' ? 'visible' : 'hidden'
      }} />
      
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

          .scrollable-content {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          
          .scrollable-content::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
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

          @keyframes pulseGlow {
            0% {
              box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
            }
            70% {
              box-shadow: 0 0 0 8px rgba(102, 126, 234, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(102, 126, 234, 0);
            }
          }

          .input-area-ready {
            animation: pulseGlow 2s ease-out;
          }

          .lets-begin-button:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
            background: rgba(255, 255, 255, 0.25) !important;
          }

          /* General paper styles */
          .paper-container::before {
            content: '';
            position: absolute;
            left: var(--margin-left);
            top: 0;
            width: 2px;
            height: 100%;
            background: var(--line-color);
            opacity: var(--line-opacity);
            pointer-events: none;
          }

          /* Mobile specific styles */
          .mobile-messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            padding-top: 80px; /* Space for top margin on paper */
            padding-bottom: 120px; /* Space for input area */
            display: flex;
            flex-direction: column;
            font-family: 'Special Elite', 'Courier New', monospace;
            font-size: 16px; /* Matched desktop font size */
            line-height: 1.8; /* Matched desktop line height */
            color: #2c3e50;
            scroll-behavior: smooth;
            scrollbar-width: none;
            -ms-overflow-style: none;
            position: absolute; /* Position messages within the paper area */
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
          }
          
          .mobile-messages-container::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
          }

          .mobile-message-card {
            border-radius: 8px; /* Slightly less rounded for paper feel */
            padding: 10px 14px;
            margin-bottom: 8px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.05); /* Softer shadow */
            max-width: calc(100% - 60px); /* Adjust for margin and padding */
            word-break: break-word;
            white-space: pre-wrap;
            animation: fadeInSlideUp 0.3s ease-out;
          }

          .mobile-message-card.system {
            background: #fefefe; /* Match paper background */
            color: #2c3e50;
            align-self: flex-start;
            margin-left: calc(var(--margin-left) + 10px); /* Align with paper margin */
            margin-right: 10px;
            border: 1px solid #e8f4fd; /* Subtle border */
          }

          .mobile-message-card.user {
            background: #e6e6fa; /* Light purple for user, like ink */
            color: #4a4a4a; /* Darker text for readability */
            align-self: flex-end;
            margin-right: 10px;
            margin-left: 10px; /* Ensure it's not too wide */
            border: 1px solid #d3d3ef;
          }

          .mobile-message-card.loading {
            background: #f0f4f8;
            color: #9ca3af;
            align-self: flex-start;
            font-style: italic;
            margin-left: calc(var(--margin-left) + 10px);
            margin-right: 10px;
          }

          @keyframes fadeInSlideUp {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }

          .mobile-input-area {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.95); /* Slightly transparent white */
            border-top: 1px solid #e2e8f0;
            padding: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
            z-index: 5;
            padding-bottom: env(safe-area-inset-bottom, 15px);
            border-radius: 0; /* No rounded corners at the bottom */
          }
          
          .mobile-input-text-wrapper {
            width: 100%;
            display: flex;
            align-items: flex-end; /* Align to bottom for textarea */
            gap: 8px;
            background: #fefefe; /* Match paper */
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            padding: 8px 12px;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
          }

          .mobile-input-textarea {
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            font-family: 'Special Elite', 'Courier New', monospace;
            font-size: 16px;
            line-height: 1.6; /* Matched desktop line height */
            color: #2c3e50;
            resize: none;
            min-height: 24px; /* Adjust for single line */
            max-height: 100px; /* Max height before scrolling */
            padding: 4px 0; /* Adjust internal padding */
          }

          .mobile-send-button {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            color: white;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s ease, transform 0.2s ease;
            flex-shrink: 0;
            box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
          }

          .mobile-send-button:disabled {
            background: #e2e8f0;
            color: #9ca3af;
            cursor: not-allowed;
            box-shadow: none;
          }

          .mobile-record-button {
            width: 50px; /* Slightly smaller */
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            color: white;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .mobile-record-button.recording {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
          }
        `}
      </style>

      {/* Main content area */}
      {appState.currentStep === 'landing' && (
        <div style={{
          minHeight: '100vh',
          width: isMobile ? '100%' : 'auto', // Full width for mobile
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center',
          padding: '40px 20px',
          position: 'relative',
          opacity: appState.isTransitioning ? 0 : 1,
          transform: 'scale(1) translateY(0)',
          transition: 'opacity 0.8s ease-out',
          pointerEvents: appState.isTransitioning ? 'none' : 'auto',
          zIndex: 2,
          // Removed paperStyles for mobile landing to match desktop gradient background
        }}>
          {/* Paper margin for mobile landing - Removed, as landing page is now gradient */}
          {/* Floating particles (Desktop only) */}
          {!isMobile && (
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
          )}

          <h1 style={{
            fontSize: isMobile ? '2.5rem' : '4.5rem',
            fontWeight: '800',
            marginBottom: isMobile ? '16px' : '24px',
            background: 'linear-gradient(45deg, #ffffff, #e0e7ff)', // Consistent gradient for both
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: isMobile ? 'none' : '0 4px 20px rgba(0,0,0,0.3)', // Text shadow only for desktop
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            AuraMythos.ai
          </h1>
          <h5 style={{
            fontSize: isMobile ? '1.1rem' : '1.2rem',
            fontWeight: '300',
            marginBottom: isMobile ? '32px' : '48px',
            color: 'rgba(255, 255, 255, 0.9)', // Consistent white for both
            maxWidth: isMobile ? '300px' : '600px',
            lineHeight: '1.6',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            Turn your ideas into fully realized stories, just like magic. <strong>Simply speak it, and watch AuraMythos give it life.</strong>
          </h5>
          
          <button 
            className="lets-begin-button"
            style={{
              padding: isMobile ? '16px 32px' : '18px 48px',
              background: isMobile 
                ? 'rgba(255, 255, 255, 0.15)' // Reverted to translucent for mobile to match desktop button style
                : 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)', // Added for mobile button as well
              border: '2px solid rgba(255, 255, 255, 0.3)', // Added for mobile button as well
              borderRadius: '50px',
              color: 'white',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
              boxShadow: isMobile ? '0 8px 32px rgba(0, 0, 0, 0.1)' : '0 8px 32px rgba(0, 0, 0, 0.1)', // Consistent shadow
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
        <div 
          // Apply paper styles directly to the main container for mobile
          style={{
            ...paperStyles,
            width: isMobile ? '100%' : '700px',
            height: isMobile ? '100vh' : '800px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: isMobile ? 'none' : 'rotateX(5deg) rotateY(-2deg)', // No float for mobile
            animation: !isMobile && appState.showNotebook ? 'gentleFloat 6s ease-in-out infinite' : 'none',
            opacity: appState.showNotebook ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
            visibility: appState.showNotebook ? 'visible' : 'hidden',
            zIndex: 2,
            willChange: 'transform',
            borderRadius: isMobile ? '0' : '3px', // No rounded corners for full-screen paper
            overflow: 'hidden' // Important for mobile to contain scrolling messages
          }}
          className="paper-container" // Class for pseudo-element margin line
        >
          {/* SCROLLABLE CONVERSATION */}
          <div 
            className="scrollable-content"
            style={{
              // Mobile message container styles
              ...(isMobile ? {
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                paddingTop: '80px', /* Space for top margin on paper */
                paddingBottom: conversationState.awaitingInput ? '120px' : '20px', /* Space for input area */
                display: 'flex',
                flexDirection: 'column',
                fontFamily: "'Special Elite', 'Courier New', monospace",
                fontSize: '16px', /* Matched desktop font size */
                lineHeight: '1.8', /* Matched desktop line height */
                color: '#2c3e50',
                scrollBehavior: 'smooth',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              } : { // Desktop message container styles
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
              })
            }}
          >
            {/* All messages */}
            {conversationState.messages.map((message, index) => {
              if (message.type === 'input') return null; // Input prompt is handled by the input area
              
              return (
                <div 
                  key={index} 
                  className={isMobile ? `mobile-message-card ${message.type}` : ''}
                  style={isMobile ? {} : { // Desktop message styles
                    marginBottom: '12px',
                    lineHeight: '1.8',
                    whiteSpace: 'pre-wrap',
                    minHeight: '28.8px',
                    ...(message.type === 'user' ? { marginLeft: '20px', color: '#667eea', fontStyle: 'italic' } : {}),
                    ...(message.type === 'loading' ? { color: '#9ca3af' } : {})
                  }}
                >
                  {message.type === 'loading' ? (
                    <span className="loading-dot">{message.content}</span>
                  ) : (
                    message.content
                  )}
                </div>
              );
            })}
            
            {/* Currently typing */}
            {conversationState.isTyping && (
              <div style={{
                marginBottom: '12px',
                lineHeight: '1.8',
                minHeight: '28.8px',
                ...(isMobile ? {
                  ...paperStyles.messageCard, // Apply base mobile card styles
                  alignSelf: 'flex-start',
                  background: '#fefefe', // Match paper background
                  color: '#2c3e50',
                  marginLeft: `calc(${paperStyles['--margin-left']} + 10px)`
                } : {})
              }}>
                {conversationState.currentTyping}
                {conversationState.showCursor && (
                  <span style={{
                    display: 'inline-block',
                    width: '2px',
                    height: isMobile ? '16px' : '20px',
                    background: '#667eea',
                    marginLeft: '2px',
                    verticalAlign: 'text-bottom',
                    animation: isMobile ? 'blink 1s infinite' : 'none' // Mobile specific blink
                  }} />
                )}
              </div>
            )}
            
            <div ref={refs.messagesEnd} />
          </div>

          {/* INPUT AREA WITH SEND ICON */}
          {conversationState.awaitingInput && (
            <div 
              className={isMobile ? 'mobile-input-area' : (conversationState.inputJustAppeared ? 'input-area-ready' : '')}
              style={isMobile ? {} : { // Desktop input area styles
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
                border: '1px solid #e2e8f0',
                transition: 'box-shadow 0.3s ease'
              }}>
              <div style={isMobile ? { ...paperStyles.textInputWrapper, ...{ width: '100%', display: 'flex', alignItems: 'flex-end', gap: '8px' } } : { flex: 1, display: 'flex' }}>
                <textarea
                  ref={refs.textInput}
                  style={isMobile ? paperStyles.mobileInputTextarea : { // Desktop textarea styles
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontFamily: "'Special Elite', 'Courier New', monospace",
                    fontSize: '16px',
                    lineHeight: '1.6', /* Matched desktop line height */
                    color: '#2c3e50',
                    resize: 'none',
                    minHeight: '24px', /* Adjust for single line */
                    maxHeight: '120px'
                  }}
                  value={userContent.input}
                  onChange={(e) => updateUserContent({ input: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (isMobile ? !e.shiftKey : e.shiftKey)) { // Enter to send on mobile, Shift+Enter on desktop
                      e.preventDefault();
                      handleUserSubmit();
                    }
                  }}
                  placeholder={conversationState.messages.find(m => m.type === 'input')?.placeholder || "Type your response..." + (isMobile ? '' : " (Shift+Enter to send)")}
                />
                
                {isMobile && userContent.input.trim() && (
                  <button
                    onClick={handleUserSubmit}
                    disabled={!userContent.input.trim()}
                    style={paperStyles.mobileSendButton}
                  >
                    ↗
                  </button>
                )}
              </div>
              
              {!isMobile && ( // Desktop specific buttons
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {['game', 'interactive'].includes(appState.selectedStyle) && (
                    <div style={{
                      padding: '6px 12px',
                      background: 'rgba(102, 126, 234, 0.2)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#667eea',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      🎮 {appState.selectedStyle === 'game' ? 'Game Mode' : 'Interactive Mode'}
                    </div>
                  )}
                  
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
              )}

              {isMobile && ( // Mobile specific buttons
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', gap: '15px' }}>
                  {appState.currentStage === 'storytelling' && (
                    <button
                      onClick={toggleRecording}
                      className={`mobile-record-button ${recordingState.isRecording ? 'recording' : ''}`}
                      title={recordingState.isRecording ? "Stop Recording" : "Start Recording"}
                    >
                      {recordingState.isRecording ? '⏹' : '🎤'}
                    </button>
                  )}
                  {['game', 'interactive'].includes(appState.selectedStyle) && (
                    <div style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '20px',
                      fontSize: '14px',
                      color: 'white',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 10px rgba(102, 126, 234, 0.3)'
                    }}>
                      🎮 {appState.selectedStyle === 'game' ? 'Game Mode' : 'Interactive Mode'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;