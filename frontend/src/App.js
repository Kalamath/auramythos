import React, { useState, useRef, useEffect } from 'react';

// ============================================================================
// ENHANCED LOGGING SYSTEM
// ============================================================================
const logger = {
  isDev: true, // Always true in artifact environment
  
  debug: (...args) => {
    if (logger.isDev) console.log('🔍 [DEBUG]', ...args);
  },
  
  info: (...args) => {
    if (logger.isDev) console.info('ℹ️ [INFO]', ...args);
  },
  
  warn: (...args) => {
    console.warn('⚠️ [WARN]', ...args);
  },
  
  error: (...args) => {
    console.error('❌ [ERROR]', ...args);
  },
  
  success: (...args) => {
    if (logger.isDev) console.log('✅ [SUCCESS]', ...args);
  },
  
  // User action tracking
  userAction: (action, data = {}) => {
    if (logger.isDev) {
      console.log('👤 [USER ACTION]', action, data);
    }
    // In production, you might send this to analytics
  },
  
  // Performance monitoring
  performance: (label, fn) => {
    if (logger.isDev) {
      console.time(`⏱️ [PERF] ${label}`);
      const result = fn();
      console.timeEnd(`⏱️ [PERF] ${label}`);
      return result;
    }
    return fn();
  }
};

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================
const ErrorBoundary = ({ children }) => {
  useEffect(() => {
    const handleError = (error) => {
      logger.error('Unhandled error:', error);
    };
    
    const handleRejection = (event) => {
      logger.error('Unhandled promise rejection:', event.reason);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);
  
  return children;
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
function App() {
  // Device detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkDevice = () => {
      const newIsMobile = window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsMobile(newIsMobile);
      logger.debug('Device detection:', { isMobile: newIsMobile, width: window.innerWidth });
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Core app state - add title visibility
  const [appState, setAppState] = useState({
    currentStep: 'landing',
    currentStage: 'naming',
    isTransitioning: false,
    selectedStyle: null,
    showNotebook: false,
    showTitle: false
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

  // User content - add title
  const [userContent, setUserContent] = useState({
    input: '',
    name: '',
    title: '',
    story: '',
    branches: [],
    currentBranch: 'main'
  });

  // Recording state
  const [recordingState, setRecordingState] = useState({
    isRecording: false,
    isSupported: false,
    showMicrophone: false
  });

  // Enhancement state - NEW FOR MAGICAL LOADING
  const [enhancementState, setEnhancementState] = useState({
    isEnhancing: false,
    showMagicalLoading: false,
    enhancementResult: null,
    awaitingApproval: false
  });
  
  // PNG Animation state - updated for 240 frames
  const [pngAnimationState, setPngAnimationState] = useState({
    currentFrame: 0,
    isPlaying: false,
    frameCount: 240, // All 240 frames for ultra-smooth animation!
    animationSpeed: 62 // ~16 FPS (240 frames over 15 seconds = 62ms per frame)
  });
  
  // Refs
  const refs = {
    messagesEnd: useRef(null),
    recognition: useRef(null),
    typingInProgress: useRef(null),
    lastProcessedIndex: useRef(0),
    messageQueue: useRef([]),
    isProcessingQueue: useRef(false),
    textInput: useRef(null),
    videoRef: useRef(null),
    pngAnimationRef: useRef(null)
  };

  // Helper functions to update grouped state
  const updateAppState = (updates) => {
    logger.debug('App state update:', updates);
    setAppState(prev => ({ ...prev, ...updates }));
  };

  const updateConversationState = (updates) => {
    if (updates.messages) {
      logger.debug('Conversation messages updated:', { 
        newCount: updates.messages.length,
        lastMessage: updates.messages[updates.messages.length - 1]?.type 
      });
    }
    setConversationState(prev => ({ ...prev, ...updates }));
  };

  const updateUserContent = (updates) => {
    logger.debug('User content update:', Object.keys(updates));
    setUserContent(prev => ({ ...prev, ...updates }));
  };

  const updateRecordingState = (updates) => {
    logger.debug('Recording state update:', updates);
    setRecordingState(prev => ({ ...prev, ...updates }));
  };

  // NEW: Helper function for enhancement state
  const updateEnhancementState = (updates) => {
    logger.debug('Enhancement state update:', updates);
    setEnhancementState(prev => ({ ...prev, ...updates }));
  };

  // Message queue for typing animation - More welcoming intro
  const conversationIntro = [
    { text: "Hi there! I'm Aura ✨", delay: 500 },
    { text: "I'm your creative storytelling companion, here to help you transform your ideas into amazing stories.", delay: 1200 },
    { text: "Whether you want to write a novel, create a comic, or craft an interactive adventure - I'll guide you through every step of your storytelling journey.", delay: 1500 },
    { text: "Let's start by getting to know each other!", delay: 1000 },
    { text: "What's your name?", delay: 800 },
    { type: 'input', placeholder: isMobile ? "Tap the microphone to say your name..." : "Type your name...", delay: 1000 }
  ];

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    refs.messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isMobile) {
      scrollToBottom();
    }
  }, [conversationState.messages, conversationState.currentTyping, isMobile]);

  // Auto-focus input when awaiting input (desktop only)
  useEffect(() => {
    if (!isMobile && conversationState.awaitingInput && refs.textInput.current) {
      setTimeout(() => {
        refs.textInput.current.focus();
        const length = refs.textInput.current.value.length;
        refs.textInput.current.setSelectionRange(length, length);
        logger.debug('Input focused for user interaction');
      }, 100);
    }
  }, [conversationState.awaitingInput, isMobile]);

  // NEW: Add global Enter key listener to skip typing animation
  useEffect(() => {
    const handleGlobalKeyPress = (e) => {
      if (e.key === 'Enter' && conversationState.isTyping && refs.typingInProgress.current) {
        // Skip typing animation - just stop the typing, don't add message yet
        refs.typingInProgress.current = false;
        // The typeMessage function will handle adding the complete message
        logger.debug('Typing animation skipped by user (Enter key)');
      }
    };

    // Add listener when typing, remove when not typing
    if (conversationState.isTyping) {
      window.addEventListener('keydown', handleGlobalKeyPress);
    }

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyPress);
    };
  }, [conversationState.isTyping]);

  // Show microphone with fade-in animation on mobile when awaiting input
  useEffect(() => {
    if (isMobile && conversationState.awaitingInput && recordingState.isSupported) {
      setTimeout(() => {
        updateRecordingState({ showMicrophone: true });
        logger.debug('Microphone button shown on mobile');
      }, 800);
    } else if (!conversationState.awaitingInput) {
      updateRecordingState({ showMicrophone: false });
    }
  }, [conversationState.awaitingInput, isMobile, recordingState.isSupported]);

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
    
    logger.debug('Processing message queue:', { queueLength: refs.messageQueue.current.length });
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
      } else if (message.type === 'story_choices') {
        addStoryChoices();
      } else if (message.isLoading) {
        addLoadingMessage(message.text);
      } else {
        await addSystemMessage(message.text);
      }
    }
    
    refs.isProcessingQueue.current = false;
    logger.debug('Message queue processing complete');
  };

  // Add messages to queue
  const queueMessages = (messages) => {
    logger.debug('Queueing messages:', { count: messages.length });
    refs.messageQueue.current.push(...messages);
    processMessageQueue();
  };

  const handleLetsBegin = () => {
    logger.userAction('lets_begin_clicked');
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
            logger.success('Transition to conversation complete');
          }, 500);
        }, 200);
      }, 800);
    }, 1000);
  };

  const typeMessage = async (text, callback) => {
    if (refs.typingInProgress.current) return;
    
    logger.debug('Starting to type message:', { length: text.length });
    refs.typingInProgress.current = true;
    updateConversationState({ isTyping: true, currentTyping: '' });
    
    for (let i = 0; i <= text.length; i++) {
      // Check if typing was interrupted (by Enter key)
      if (!refs.typingInProgress.current) {
        // If interrupted, show full text and break out of loop
        updateConversationState({ currentTyping: text });
        logger.debug('Typing interrupted - showing full message');
        break;
      }
      
      updateConversationState({ currentTyping: text.slice(0, i) });
      await new Promise(resolve => setTimeout(resolve, isMobile ? 15 : 30));
    }
    
    // Always complete the typing process normally
    refs.typingInProgress.current = false;
    updateConversationState({ isTyping: false, currentTyping: '' });
    logger.debug('Message typing complete');
    
    if (callback) callback();
  };

  const addSystemMessage = (text) => {
    return new Promise((resolve) => {
      typeMessage(text, () => {
        setConversationState(prev => ({ 
          ...prev,
          messages: [...prev.messages, { type: 'system', content: text, timestamp: Date.now() }]
        }));
        logger.debug('System message added:', { preview: text.substring(0, 50) + '...' });
        resolve();
      });
    });
  };

  const addUserMessage = (text) => {
    setConversationState(prev => ({ 
      ...prev,
      messages: [...prev.messages, { type: 'user', content: text, timestamp: Date.now() }]
    }));
    logger.userAction('user_message_added', { length: text.length, preview: text.substring(0, 30) });
  };

  const addInputPrompt = (placeholder) => {
    setConversationState(prev => ({ 
      ...prev,
      messages: [...prev.messages, { type: 'input', placeholder, timestamp: Date.now() }]
    }));
    logger.debug('Input prompt added:', { placeholder });
  };

  const addLoadingMessage = (text) => {
    setConversationState(prev => ({ 
      ...prev,
      messages: [...prev.messages, { type: 'loading', content: text, timestamp: Date.now() }]
    }));
    logger.debug('Loading message added:', text);
  };

  const addStoryChoices = () => {
    setConversationState(prev => ({ 
      ...prev,
      messages: [...prev.messages, { 
        type: 'story_choices', 
        content: '', 
        timestamp: Date.now() 
      }]
    }));
    logger.debug('Story choices added');
  };

  // NEW: Add magical loading message
  const addMagicalLoading = () => {
    setConversationState(prev => ({ 
      ...prev,
      messages: [...prev.messages, { 
        type: 'magical_loading', 
        content: '', 
        timestamp: Date.now() 
      }]
    }));
    logger.debug('Magical loading animation added');
  };

  // NEW: Add enhancement result with approval system
  const addEnhancementResult = (enhancedStory) => {
    setConversationState(prev => ({ 
      ...prev,
      messages: [...prev.messages, { 
        type: 'enhancement_result', 
        content: enhancedStory,
        timestamp: Date.now() 
      }]
    }));
    logger.debug('Enhancement result added with approval system');
  };

  // PNG Animation controller
  useEffect(() => {
    let animationInterval;
    
    if (pngAnimationState.isPlaying) {
      console.log('🎬 Starting PNG animation sequence...');
      
      animationInterval = setInterval(() => {
        setPngAnimationState(prev => ({
          ...prev,
          currentFrame: (prev.currentFrame + 1) % prev.frameCount
        }));
      }, pngAnimationState.animationSpeed);
    }
    
    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [pngAnimationState.isPlaying, pngAnimationState.animationSpeed]);

  // Start PNG animation when magical loading appears
  useEffect(() => {
    const hasMagicalLoading = conversationState.messages.some(msg => msg.type === 'magical_loading');
    
    if (hasMagicalLoading && !pngAnimationState.isPlaying) {
      console.log('✨ Starting magical PNG animation...');
      setPngAnimationState(prev => ({ ...prev, isPlaying: true, currentFrame: 0 }));
    } else if (!hasMagicalLoading && pngAnimationState.isPlaying) {
      console.log('🛑 Stopping PNG animation...');
      setPngAnimationState(prev => ({ ...prev, isPlaying: false, currentFrame: 0 }));
    }
  }, [conversationState.messages, pngAnimationState.isPlaying]);

  // Handle story choice clicks
  const handleStoryChoice = (choice) => {
    logger.userAction('story_choice_selected', { choice });
    addUserMessage(choice);
    handleStoryTypeSelection(choice);
    
    // Remove the story choices from view
    setConversationState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.type !== 'story_choices')
    }));
  };

  const handleUserSubmit = async (inputText = null) => {
    const input = inputText || userContent.input.trim();
    if (!input || !conversationState.awaitingInput) return;
    
    logger.userAction('user_submit', {
      stage: appState.currentStage,
      inputLength: input.length,
      selectedStyle: appState.selectedStyle,
      inputMethod: inputText ? 'voice' : 'keyboard'
    });
    
    addUserMessage(input);
    updateUserContent({ input: '' });
    updateConversationState({ awaitingInput: false });

    setConversationState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.type !== 'input')
    }));

    if (appState.currentStage === 'naming') {
      const trimmedName = input.trim();
      if (trimmedName.length < 1) {
        logger.warn('User provided empty name');
        queueMessages([
          { text: "I'd love to know what to call you!", delay: 500 },
          { type: 'input', placeholder: isMobile ? "Tap the microphone to say your name..." : "Type your name...", delay: 0 }
        ]);
        return;
      }

      logger.userAction('name_provided', { 
        nameLength: trimmedName.length,
        name: trimmedName 
      });
      updateUserContent({ name: trimmedName });
      
      updateAppState({ currentStage: 'story_type_selection' });
      queueMessages([
        { text: `Nice to meet you, ${trimmedName}! 🌟`, delay: 800 },
        { text: "I'm so excited to help you create something amazing together.", delay: 1000 },
        { text: "First, let's give your story a title. What would you like to call it?", delay: 1200 },
        { type: 'input', placeholder: isMobile ? "Tap the microphone to say your title..." : "Type your story title...", delay: 1000 }
      ]);
    } else if (appState.currentStage === 'story_type_selection') {
      const trimmedTitle = input.trim();
      if (trimmedTitle.length < 1) {
        logger.warn('User provided empty title');
        queueMessages([
          { text: "Every great story needs a title! What would you like to call yours?", delay: 500 },
          { type: 'input', placeholder: isMobile ? "Tap the microphone to say your title..." : "Type your story title...", delay: 0 }
        ]);
        return;
      }

      logger.userAction('title_provided', { 
        title: trimmedTitle,
        titleLength: trimmedTitle.length 
      });
      updateUserContent({ title: trimmedTitle });
      
      // Show the title with fade-in effect
      setTimeout(() => {
        updateAppState({ showTitle: true });
        logger.debug('Title displayed in notebook');
      }, 800);
      
      updateAppState({ currentStage: 'format_selection' });
      queueMessages([
        { text: `"${trimmedTitle}" - I love that title! ✨`, delay: 800 },
        { text: "Now, what kind of story format would you like to create?", delay: 1200 },
        { type: 'story_choices', delay: 1400 }
      ]);
    } else if (appState.currentStage === 'format_selection') {
      handleStoryTypeSelection(input);
    } else if (appState.currentStage === 'storytelling') {
      handleStorySubmission(input);
    } else if (appState.currentStage === 'choice') {
      handleChoiceSelection(input);
    }
  };

  const handleStoryTypeSelection = (input) => {
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
      logger.userAction('story_format_selected', { 
        format: selectedType,
        userInput: input 
      });
      
      updateAppState({ 
        selectedStyle: selectedType,
        currentStage: 'storytelling' 
      });
      
      queueMessages([
        { text: `Perfect! Let's create your ${selectedType}. 📚`, delay: 800 },
        { text: "Tell me your story - you can share it with me now.", delay: 800 },
        { text: isMobile ? "🎤 Tap the microphone to begin!" : "🎤 You can also use the microphone button to record your voice!", delay: 800 },
        { type: 'input', placeholder: isMobile ? `Tap the microphone to tell your ${selectedType} story...` : `Tell me your ${selectedType} story...`, delay: 800 }
      ]);
    } else {
      logger.warn('Unrecognized story format:', input);
      queueMessages([
        { text: "I didn't quite catch that. Please choose: book, comic, screenplay, content, game, or interactive.", delay: 500 },
        { type: 'input', placeholder: isMobile ? "Tap the microphone to say your choice..." : "Type your choice...", delay: 0 }
      ]);
    }
  };

  const handleStorySubmission = (input) => {
    if (input.length < 10) {
      logger.warn('Story submission too short:', { length: input.length });
      queueMessages([
        { text: "That's a bit short! Please tell me more about your story (at least 10 characters).", delay: 0 },
        { type: 'input', placeholder: isMobile ? `Tap the microphone to continue your ${appState.selectedStyle} story...` : `Continue your ${appState.selectedStyle} story...`, delay: 0 }
      ]);
      return;
    }

    logger.userAction('story_submitted', {
      storyLength: input.length,
      wordCount: input.split(' ').length,
      format: appState.selectedStyle
    });

    updateUserContent({ story: input });
    updateAppState({ currentStage: 'choice' });
    
    queueMessages([
      { text: "Wonderful! I can see your creative energy flowing. ✨", delay: 800 },
      { text: "How would you like me to help you with this story?", delay: 800 },
      { text: "✨ Enhance - I'll use AI magic to transform and improve it", delay: 800 },
      { text: "✏️ Refine - You can make manual edits and improvements", delay: 800 },
      { type: 'input', placeholder: isMobile ? "Say 'enhance' or 'refine'..." : "Type 'enhance' or 'refine'...", delay: 800 }
    ]);
  };

  const handleChoiceSelection = (input) => {
    const lowerInput = input.toLowerCase();
    
    logger.userAction('choice_selected', { 
      choice: lowerInput,
      format: appState.selectedStyle 
    });
    
    if (lowerInput.includes('enhance')) {
      enhanceStory();
    } else {
      logger.warn('Invalid choice selection:', lowerInput);
      queueMessages([
        { text: "Please choose 'enhance' or 'refine'.", delay: 0 },
        { type: 'input', placeholder: isMobile ? "Tap the microphone to say your choice..." : "Type your choice...", delay: 0 }
      ]);
    }
  };

  // ============================================================================
  // ENHANCE STORY FUNCTION WITH MAGICAL LOADING
  // ============================================================================
  const enhanceStory = async () => {
    logger.userAction('enhance_story_start', {
      originalLength: userContent.story.length,
      originalWordCount: userContent.story.split(' ').length,
      format: appState.selectedStyle
    });

    // Start the enhancement process
    updateEnhancementState({ isEnhancing: true, showMagicalLoading: true });
    
    // Aura's initial response
    await addSystemMessage("Perfect! Let me weave some magic into your story... ✨");
    
    // Show magical loading animation (removes all previous loading messages)
    setConversationState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.type !== 'loading')
    }));
    
    addMagicalLoading();
    
    // Wait for magical loading (15 seconds for dramatic effect)
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Remove magical loading
    setConversationState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.type !== 'magical_loading')
    }));
    
    // Generate enhanced story
    const enhancedStory = generateEnhancedStory(userContent.story, appState.selectedStyle);
    
    // Store the enhancement result
    updateEnhancementState({ 
      enhancementResult: {
        original: userContent.story,
        enhanced: enhancedStory,
        approved: false
      },
      awaitingApproval: true,
      isEnhancing: false,
      showMagicalLoading: false
    });
    
    logger.userAction('enhance_story_complete', {
      enhancedLength: enhancedStory.length,
      enhancedWordCount: enhancedStory.split(' ').length,
      improvement: `${enhancedStory.split(' ').length - userContent.story.split(' ').length} words added`,
      format: appState.selectedStyle
    });
    
    // Add enhanced result with approval system (appears instantly)
    addEnhancementResult(enhancedStory);
    
    // Aura asks for approval
    queueMessages([
      { text: "✨ How does this enhanced version look, " + (userContent.name || 'my friend') + "?", delay: 1000 }
    ]);
  };

  // NEW: Handle approval/denial of enhancement
  const handleEnhancementApproval = (approved) => {
    logger.userAction('enhancement_approval', { approved });
    
    if (approved) {
      updateEnhancementState({ 
        awaitingApproval: false,
        enhancementResult: { 
          ...enhancementState.enhancementResult, 
          approved: true 
        }
      });
      
      queueMessages([
        { text: "🎉 Wonderful! Your enhanced story has been saved and is ready for download.", delay: 800 },
        { text: "In the full version, you'd be able to export as PDF, continue editing, or share your creation!", delay: 1000 },
        { text: "Thank you for using AuraMythos! ✨", delay: 800 }
      ]);
    } else {
      updateEnhancementState({ awaitingApproval: false });
      
      // Remove enhancement result from messages
      setConversationState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => msg.type !== 'enhancement_result')
      }));
      
      queueMessages([
        { text: "No problem! Keeping your original version.", delay: 500 },
        { text: "Would you like to try a different enhancement approach?", delay: 800 },
        { type: 'input', placeholder: isMobile ? "Say 'enhance again'..." : "Type 'enhance again'...", delay: 800 }
      ]);
      
      updateAppState({ currentStage: 'choice' });
    }
  };

  // Generate realistic enhanced stories based on format
  const generateEnhancedStory = (originalStory, format) => {
    const userName = userContent.name || 'there';
    
    return `📖 ENHANCED ${format.toUpperCase()}

"${originalStory}"

${userName}, your story has been transformed with rich, immersive details:

CHAPTER ONE: THE BEGINNING

The morning mist clung to the cobblestones like forgotten dreams, each droplet catching the amber light of dawn. Our protagonist stood at the threshold of destiny, their breath visible in the crisp air that carried whispers of adventure.

The ancient walls around them seemed to pulse with hidden stories. Every shadow held secrets, every sound carried meaning.

But beneath the beauty lay danger – a challenge that would test not just courage, but the very essence of who they were meant to become.

This was no ordinary day. This was the day everything would change.

[Enhanced with: Rich atmospheric details, compelling character development, foreshadowing, and immersive world-building]`;
  };

  return (
    <ErrorBoundary>
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

            @keyframes floatSparkle {
              0% { 
                transform: translateY(0px) scale(0.8);
                opacity: 0.3;
              }
              25% { 
                transform: translateY(-8px) scale(1.2);
                opacity: 0.8;
              }
              50% { 
                transform: translateY(-15px) scale(1);
                opacity: 1;
              }
              75% { 
                transform: translateY(-8px) scale(1.1);
                opacity: 0.6;
              }
              100% { 
                transform: translateY(0px) scale(0.8);
                opacity: 0.3;
              }
            }

            @keyframes pulseGlow {
              0% {
                transform: scale(1);
                opacity: 0.8;
              }
              50% {
                transform: scale(1.1);
                opacity: 1;
              }
              100% {
                transform: scale(1);
                opacity: 0.8;
              }
            }
            
            @keyframes textGlow {
              0%, 100% { color: #667eea; }
              50% { color: #764ba2; }
            }

            @keyframes fadeInUp {
              0% {
                opacity: 0;
                transform: translateX(-50%) translateY(20px) scale(0.8);
              }
              100% {
                opacity: 1;
                transform: translateX(-50%) translateY(0) scale(1);
              }
            }

            @keyframes fadeInUpChoices {
              0% {
                opacity: 0;
                transform: translateX(-50%) translateY(20px) scale(0.95);
              }
              100% {
                opacity: 1;
                transform: translateX(-50%) translateY(0) scale(1);
              }
            }

            @keyframes fadeInTitle {
              0% {
                opacity: 0;
                transform: translateY(-10px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }

            /* ENHANCED MP4 VIDEO LOADING STYLES - NO BORDERS */
            .magical-loading {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 30px 20px;
              margin: 16px 0;
              background: transparent;
              border: 2px dashed rgba(102, 126, 234, 0.3);
              border-radius: 8px;
            }
            
            .speech-bubble-container {
              position: relative;
              width: 180px;
              height: 120px;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              border-radius: 8px;
              background: transparent;
              border: none;
              outline: none;
            }
            
            .speech-bubble-video {
              width: 100%;
              height: 100%;
              object-fit: contain;
              background: transparent;
              border: none;
              outline: none;
              border-radius: 8px;
              /* Remove any potential video borders */
              -webkit-mask-image: -webkit-radial-gradient(white, black);
              mask-image: radial-gradient(white, black);
            }
            
            .video-fallback {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 100%;
              background: rgba(102, 126, 234, 0.1);
              border-radius: 8px;
              color: #667eea;
            }
            
            .fallback-icon {
              font-size: 48px;
              margin-bottom: 8px;
              animation: spin 2s linear infinite;
            }
            
            .magical-text {
              font-size: 18px;
              font-weight: 600;
              color: #667eea;
              text-align: center;
              animation: textGlow 2s ease-in-out infinite;
              text-shadow: none;
              font-family: 'Special Elite', 'Courier New', monospace;
            }

            /* INLINE ENHANCEMENT RESULT */
            .enhancement-content {
              background: transparent;
              padding: 0;
              margin: 12px 0;
              line-height: 1.8;
              color: #2c3e50;
              white-space: pre-wrap;
              font-family: 'Special Elite', 'Courier New', monospace;
              border-left: 3px solid #667eea;
              padding-left: 15px;
              margin-left: 10px;
            }

            /* INLINE APPROVAL BUTTONS */
            .approval-buttons {
              display: flex;
              gap: 10px;
              margin: 16px 0;
              justify-content: flex-start;
              margin-left: 10px;
            }

            .approval-btn {
              padding: 8px 16px;
              border: 1px solid #d1d5db;
              border-radius: 4px;
              background: rgba(255, 255, 255, 0.8);
              color: #374151;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
              font-family: 'Special Elite', 'Courier New', monospace;
              font-size: 14px;
            }

            .approval-btn.approve:hover {
              background: rgba(34, 197, 94, 0.1);
              border-color: #22c55e;
              color: #16a34a;
            }

            .approval-btn.deny:hover {
              background: rgba(239, 68, 68, 0.1);
              border-color: #ef4444;
              color: #dc2626;
            }

            .story-choices {
              margin: 16px auto;
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 8px;
              max-width: 420px;
              width: calc(100% - 80px);
              position: absolute;
              left: 50%;
              transform: translateX(-50%);
              animation: fadeInUpChoices 0.8s ease-out;
            }

            .story-choice {
              display: flex;
              align-items: center;
              text-align: left;
              background: transparent;
              border: none;
              padding: 8px 6px;
              margin: 0;
              font-family: 'Special Elite', 'Courier New', monospace;
              font-size: 13px;
              line-height: 1.3;
              color: #2c3e50;
              cursor: pointer;
              transition: background-color 0.15s ease;
              border-radius: 4px;
              min-height: 36px;
            }

            .story-choice:hover {
              background-color: rgba(102, 126, 234, 0.08);
            }

            .story-choice::before {
              content: '';
              width: 14px;
              height: 14px;
              border: 1.5px solid #d1d5db;
              border-radius: 50%;
              margin-right: 8px;
              flex-shrink: 0;
              transition: all 0.15s ease;
            }

            .story-choice:hover::before {
              border-color: #667eea;
            }

            .story-choice-content {
              display: flex;
              flex-direction: column;
              flex: 1;
              min-width: 0;
            }

            .story-choice .title {
              font-weight: 600;
              margin-bottom: 1px;
              font-size: 13px;
              color: inherit;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .story-choice .description {
              font-size: 10px;
              opacity: 0.7;
              line-height: 1.2;
              color: inherit;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .notebook-title {
              position: absolute;
              top: 45px;
              left: calc(var(--margin-left) + 20px);
              right: 60px;
              font-family: 'Kalam', cursive;
              font-size: 22px;
              font-weight: 600;
              color: #2c3e50;
              text-align: center;
              opacity: 0;
              animation: fadeInTitle 1.2s ease-out forwards;
              padding-bottom: 8px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .mobile-message {
              margin-bottom: 12px;
              line-height: 1.8;
              white-space: pre-wrap;
              min-height: 28.8px;
              word-break: break-word;
            }

            .mobile-message.system {
              color: #2c3e50;
              margin-left: calc(var(--margin-left) + 10px);
              margin-right: 10px;
            }

            .mobile-message.user {
              color: #667eea;
              font-style: italic;
              margin-left: calc(var(--margin-left) + 30px);
              margin-right: 10px;
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
          `}
        </style>

        {/* Main content area */}
        {appState.currentStep === 'landing' && (
          <div style={{
            minHeight: '100vh',
            width: isMobile ? '100%' : 'auto',
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
          }}>
            {/* Floating particles (Desktop only) - RESTORED! */}
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
              background: 'linear-gradient(45deg, #ffffff, #e0e7ff)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: isMobile ? 'none' : '0 4px 20px rgba(0,0,0,0.3)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              AuraMythos.ai
            </h1>
            <h5 style={{
              fontSize: isMobile ? '1.1rem' : '1.2rem',
              fontWeight: '300',
              marginBottom: isMobile ? '32px' : '48px',
              color: 'rgba(255, 255, 255, 0.9)',
              maxWidth: isMobile ? '300px' : '600px',
              lineHeight: '1.6',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              Turn your ideas into fully realized stories, just like magic. <strong>Simply speak it, and watch AuraMythos give it life.</strong>
            </h5>
            
            <button 
              style={{
                padding: isMobile ? '16px 32px' : '18px 48px',
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
                transform: 'translateY(0)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                e.target.style.background = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
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
            style={{
              background: '#fefefe',
              position: 'relative',
              boxShadow: `
                0 25px 50px rgba(0,0,0,0.1),
                0 5px 15px rgba(0,0,0,0.05),
                inset 0 1px 0 rgba(255,255,255,0.9)
              `,
              borderRadius: '3px',
              backgroundImage: `repeating-linear-gradient(
                transparent,
                transparent 27px,
                #e8f4fd 27px,
                #e8f4fd 28px
              )`,
              backgroundPosition: `0 ${isMobile ? '80px' : '100px'}`,
              backgroundSize: `100% calc(100% - ${isMobile ? '80px' : '100px'})`,
              backgroundRepeat: 'repeat',
              '--margin-left': isMobile ? '40px' : '80px',
              '--line-color': '#ffb3ba',
              '--line-opacity': 0.6,
              '--title-height': isMobile ? '80px' : '100px',
              width: isMobile ? '100%' : '700px',
              height: isMobile ? '100vh' : '800px',
              display: 'flex',
              flexDirection: 'column',
              transformStyle: 'preserve-3d',
              transform: isMobile ? 'none' : 'rotateX(5deg) rotateY(-2deg)',
              animation: !isMobile && appState.showNotebook ? 'gentleFloat 6s ease-in-out infinite' : 'none',
              opacity: appState.showNotebook ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
              visibility: appState.showNotebook ? 'visible' : 'hidden',
              zIndex: 2,
              willChange: !isMobile && appState.showNotebook ? 'transform' : 'auto',
              backfaceVisibility: 'hidden',
              overflow: 'hidden'
            }}
          >
            {/* Red margin line */}
            <div style={{
              position: 'absolute',
              left: 'var(--margin-left)',
              top: 0,
              width: '2px',
              height: '100%',
              background: 'var(--line-color)',
              opacity: 'var(--line-opacity)',
              pointerEvents: 'none',
              zIndex: 2
            }} />

            {/* TITLE SECTION */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 'var(--title-height)',
              background: '#fefefe',
              borderBottom: '1px solid #e8f4fd',
              zIndex: 1
            }}>
              {appState.showTitle && userContent.title && (
                <div className="notebook-title">
                  {userContent.title}
                </div>
              )}
            </div>

            {/* SCROLLABLE CONVERSATION */}
            <div 
              className="scrollable-content"
              style={{
                ...(isMobile ? {
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px',
                  paddingTop: '100px',
                  paddingBottom: '140px',
                  display: 'flex',
                  flexDirection: 'column',
                  fontFamily: "'Special Elite', 'Courier New', monospace",
                  fontSize: '16px',
                  lineHeight: '1.8',
                  color: '#2c3e50',
                  scrollBehavior: 'smooth',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                } : {
                  position: 'absolute',
                  top: '120px',
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
                if (message.type === 'input') return null;
                
                // SIMPLE: Handle magical loading animation - Single GIF
                if (message.type === 'magical_loading') {
                  return (
                    <div key={index} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '30px 20px',
                      margin: '16px 0',
                      background: 'transparent', // No background to preserve paper lines
                      border: 'none', // No border to disrupt paper
                      borderRadius: 0
                    }}>
                      <div style={{
                        position: 'relative',
                        width: '180px',
                        height: '120px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent' // Completely transparent
                      }}>
                        {/* Simple GIF Animation - No borders, perfect transparency */}
                        <img 
                          src="/images/speech-bubble-loading.gif"
                          alt="Loading animation"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            imageRendering: '-webkit-optimize-contrast'
                          }}
                          onError={(e) => {
                            console.log('📄 GIF not found, showing CSS fallback');
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                          onLoad={() => {
                            console.log('🎬 GIF loaded successfully!');
                          }}
                        />
                        
                        {/* Pure CSS Animation Fallback - No borders, blends with paper */}
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          display: 'none', // Hidden until GIF fails
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.8
                        }}>
                          {/* Floating sparkles that don't disrupt paper lines */}
                          {[...Array(6)].map((_, i) => (
                            <div
                              key={i}
                              style={{
                                position: 'absolute',
                                width: '8px',
                                height: '8px',
                                background: '#667eea',
                                borderRadius: '50%',
                                left: `${30 + i * 20}px`,
                                top: `${20 + Math.sin(i) * 15}px`,
                                animation: `floatSparkle ${2 + i * 0.3}s ease-in-out infinite`,
                                animationDelay: `${i * 0.2}s`,
                                opacity: 0.7
                              }}
                            />
                          ))}
                          
                          {/* Central magical symbol */}
                          <div style={{
                            fontSize: '32px',
                            color: '#667eea',
                            animation: 'pulseGlow 2s ease-in-out infinite',
                            textShadow: '0 0 10px rgba(102, 126, 234, 0.3)',
                            background: 'transparent'
                          }}>
                            ✨
                          </div>
                        </div>
                      </div>
                      
                      <div className="magical-text" style={{
                        background: 'transparent', // No background
                        padding: '0', // No padding
                        margin: '0', // No margin
                        border: 'none' // No borders
                      }}>
                        ✨ Weaving story magic... ✨
                      </div>
                    </div>
                  );
                }

                // Handle enhancement result with approval
                if (message.type === 'enhancement_result') {
                  return (
                    <div key={index} className={isMobile ? 'mobile-message system' : ''}>
                      <div style={{ 
                        marginBottom: '12px',
                        color: '#16a34a',
                        fontWeight: '600'
                      }}>
                        ✅ Story Enhanced Successfully!
                      </div>
                      <div className="enhancement-content">
                        {message.content}
                      </div>
                      {enhancementState.awaitingApproval && (
                        <div style={{ marginTop: '16px' }}>
                          <div className="approval-buttons">
                            <button 
                              className="approval-btn approve" 
                              onClick={() => handleEnhancementApproval(true)}
                            >
                              ✅ Approve
                            </button>
                            <button 
                              className="approval-btn deny" 
                              onClick={() => handleEnhancementApproval(false)}
                            >
                              ❌ Deny
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                
                if (message.type === 'story_choices') {
                  return (
                    <div key={index} className="story-choices">
                      <button className="story-choice" onClick={() => handleStoryChoice('Book')}>
                        <div className="story-choice-content">
                          <span className="title">Book</span>
                          <span className="description">Rich narrative</span>
                        </div>
                      </button>
                      <button className="story-choice" onClick={() => handleStoryChoice('Comic')}>
                        <div className="story-choice-content">
                          <span className="title">Comic</span>
                          <span className="description">Visual panels</span>
                        </div>
                      </button>
                      <button className="story-choice" onClick={() => handleStoryChoice('Screenplay')}>
                        <div className="story-choice-content">
                          <span className="title">Screenplay</span>
                          <span className="description">Scene breakdown</span>
                        </div>
                      </button>
                      <button className="story-choice" onClick={() => handleStoryChoice('Content')}>
                        <div className="story-choice-content">
                          <span className="title">Content</span>
                          <span className="description">Blog article</span>
                        </div>
                      </button>
                      <button className="story-choice" onClick={() => handleStoryChoice('Game')}>
                        <div className="story-choice-content">
                          <span className="title">Game</span>
                          <span className="description">Interactive</span>
                        </div>
                      </button>
                      <button className="story-choice" onClick={() => handleStoryChoice('Interactive')}>
                        <div className="story-choice-content">
                          <span className="title">Interactive</span>
                          <span className="description">Branching</span>
                        </div>
                      </button>
                    </div>
                  );
                }
                
                return (
                  <div 
                    key={index} 
                    className={isMobile ? `mobile-message ${message.type}` : ''}
                    style={isMobile ? {} : {
                      marginBottom: '12px',
                      lineHeight: '1.8',
                      whiteSpace: 'pre-wrap',
                      minHeight: '28.8px',
                      ...(message.type === 'user' ? { marginLeft: '20px', color: '#667eea', fontStyle: 'italic' } : {}),
                      ...(message.type === 'loading' ? { color: '#9ca3af' } : {})
                    }}
                  >
                    {message.content}
                  </div>
                );
              })}
              
              {/* Currently typing */}
              {conversationState.isTyping && (
                <div 
                  className={isMobile ? 'mobile-message system' : ''}
                  style={{
                    marginBottom: '12px',
                    lineHeight: '1.8',
                    minHeight: '28.8px'
                  }}
                >
                  {conversationState.currentTyping}
                  {conversationState.showCursor && (
                    <span style={{
                      display: 'inline-block',
                      width: '2px',
                      height: isMobile ? '16px' : '20px',
                      background: '#667eea',
                      marginLeft: '2px',
                      verticalAlign: 'text-bottom',
                      animation: 'blink 1s infinite'
                    }} />
                  )}
                  {/* Hint for skipping */}
                  {!isMobile && (
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      marginTop: '4px',
                      opacity: 0.7
                    }}>
                      Press Enter to skip ⏩
                    </div>
                  )}
                </div>
              )}
              
              <div ref={refs.messagesEnd} />
            </div>

            {/* INPUT AREA - Desktop Only */}
            {!isMobile && conversationState.awaitingInput && (
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
                  ref={refs.textInput}
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
                      e.preventDefault();
                      handleUserSubmit();
                    }
                  }}
                  placeholder={conversationState.messages.find(m => m.type === 'input')?.placeholder || "Type your response... (Shift+Enter to send)"}
                />
                
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => handleUserSubmit()}
                  disabled={!userContent.input.trim()}
                >
                  ↗
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;