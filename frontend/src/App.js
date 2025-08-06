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
// AUDIOPEN-STYLE CORNER NAVIGATION COMPONENT
// ============================================================================
const CornerNavigation = ({ 
  onButtonClick, 
  activeButton = null, 
  isVisible = true, 
  currentStep = 'landing' 
}) => {
  const cornerButtons = [
    { 
      id: 'back', 
      icon: '←', 
      position: 'topLeft',
      label: 'Back',
      action: 'goBack',
      showOn: ['conversation', 'dashboard', 'stats'] // Added stats
    },
    { 
      id: 'settings', 
      icon: '⚙️', 
      position: 'topRight',
      label: 'Settings',
      action: 'openSettings',
      showOn: ['conversation', 'dashboard', 'auth', 'stats'] // Added stats
    },
    { 
      id: 'upload', 
      icon: '📁', 
      position: 'bottomLeft',
      label: 'Upload File',
      action: 'uploadFile',
      showOn: ['conversation', 'dashboard']
    },
    { 
      id: 'stats', 
      icon: '🏆', 
      position: 'bottomRight',
      label: 'Your Stats',
      action: 'viewStats',
      showOn: ['dashboard'] // Only show on dashboard
    }
  ];

  const cornerButtonStyle = (position, isActive = false) => ({
    position: 'fixed',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: isActive 
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    border: isActive 
      ? 'none'
      : '1px solid rgba(0, 0, 0, 0.08)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    color: isActive ? 'white' : '#64748b',
    transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
    zIndex: 200,
    boxShadow: isActive 
      ? '0 8px 24px rgba(102, 126, 234, 0.3)'
      : '0 4px 12px rgba(0, 0, 0, 0.1)',
    
    // Position based on corner
    ...(position === 'topLeft' && { top: '20px', left: '20px' }),
    ...(position === 'topRight' && { top: '20px', right: '20px' }),
    ...(position === 'bottomLeft' && { bottom: '20px', left: '20px' }),
    ...(position === 'bottomRight' && { bottom: '20px', right: '20px' }),
    
    // Hide/show animation
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'scale(1)' : 'scale(0.8)',
    pointerEvents: isVisible ? 'auto' : 'none'
  });

  const handleButtonClick = (button, event) => {
    event.stopPropagation();
    logger.userAction('corner_button_clicked', { 
      buttonId: button.id, 
      action: button.action,
      currentStep 
    });
    onButtonClick?.(button.id, button.action);
  };

  // Filter buttons based on current screen
  const visibleButtons = cornerButtons.filter(button => 
    button.showOn.includes(currentStep)
  );

  if (!isVisible || visibleButtons.length === 0) return null;

  return (
    <>
      <style>
        {`
          .corner-button:hover {
            transform: scale(1.1) !important;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15) !important;
          }
          
          .corner-button:active {
            transform: scale(0.95) !important;
          }
          
          .corner-button-topLeft:hover {
            color: #64748b !important;
            box-shadow: 0 6px 20px rgba(100, 116, 139, 0.2) !important;
          }
          
          .corner-button-topLeft.active {
            background: linear-gradient(135deg, #64748b 0%, #475569 100%) !important;
          }
          
          .corner-button-bottomRight:hover {
            color: #f59e0b !important;
            box-shadow: 0 6px 20px rgba(245, 158, 11, 0.2) !important;
          }
          
          .corner-button-bottomLeft:hover {
            color: #f59e0b !important;
            box-shadow: 0 6px 20px rgba(245, 158, 11, 0.2) !important;
          }
          
          .corner-button-topRight:hover {
            color: #8b5cf6 !important;
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.2) !important;
          }
        `}
      </style>
      
      {visibleButtons.map((button) => {
        const isActive = activeButton === button.id;
        
        return (
          <button
            key={button.id}
            style={cornerButtonStyle(button.position, isActive)}
            onClick={(e) => handleButtonClick(button, e)}
            title={button.label}
            className={`corner-button corner-button-${button.position} ${isActive ? 'active' : ''}`}
          >
            {button.icon}
          </button>
        );
      })}
    </>
  );
};

// ============================================================================
// BACKEND API INTEGRATION (Defined outside component to avoid reference issues)
// ============================================================================
const API_BASE = 'http://localhost:5001';

// API functions to connect to your backend
const apiClient = {
  async enhanceStory(story, format, options = {}) {
    try {
      console.log('🌐 Calling backend API:', { story: story.substring(0, 50) + '...', format });
      
      const response = await fetch(`${API_BASE}/api/enhance-story`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          text: story,
          format: format,
          useIterative: true, // Use your iterative system
          userAge: 'unknown',
          generateVisuals: false, // Start without visuals for MVP
          ...options
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Backend response received:', { 
        success: result.success, 
        enhanced: result.enhanced?.substring(0, 100) + '...' 
      });
      
      return result;
    } catch (error) {
      console.error('❌ Backend API call failed:', error);
      // Fallback to your current mock system
      return null;
    }
  },
  
  async continueStory(newInput, previousContext, format, conversationHistory = []) {
    try {
      console.log('🌐 Continuing story via backend...');
      
      const response = await fetch(`${API_BASE}/api/continue-story`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          text: newInput,
          previousContext,
          format,
          conversationHistory,
          userAge: 'unknown'
        })
      });
      
      const result = await response.json();
      console.log('✅ Story continuation received');
      
      return result;
    } catch (error) {
      console.error('❌ Story continuation failed:', error);
      return null;
    }
  },
  
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      const result = await response.json();
      console.log('💓 Backend health check:', result.status);
      return result;
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      return { status: 'offline', error: error.message };
    }
  }
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

  // Core app state - add title visibility and stats page
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
  
  // User authentication and story persistence
  const [userState, setUserState] = useState({
    isSignedIn: false,
    user: null,
    stories: [],
    currentStoryId: null
  });

  // Backend connection state
  const [backendState, setBackendState] = useState({
    connected: false,
    health: null,
    lastCheck: null
  });

  // NEW: Corner navigation state
  const [cornerNavState, setCornerNavState] = useState({
    activeButton: null,
    showCornerNav: true
  });

  // Load user data from localStorage on startup
  useEffect(() => {
    const savedUser = localStorage.getItem('auramythos_user');
    const savedStories = localStorage.getItem('auramythos_stories');
    
    if (savedUser) {
      const user = JSON.parse(savedUser);
      const stories = savedStories ? JSON.parse(savedStories) : [];
      
      setUserState({
        isSignedIn: true,
        user,
        stories,
        currentStoryId: null
      });
      
      logger.success('User data loaded:', { 
        userName: user.name, 
        storiesCount: stories.length 
      });
    }
  }, []);

  // Save user data to localStorage
  const saveUserData = (user, stories) => {
    localStorage.setItem('auramythos_user', JSON.stringify(user));
    localStorage.setItem('auramythos_stories', JSON.stringify(stories));
    logger.debug('User data saved to localStorage');
  };

  // Create new user account
  const createUserAccount = (name, email = null) => {
    const newUser = {
      id: Date.now(),
      name,
      email,
      createdAt: new Date().toISOString(),
      avatarColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'][Math.floor(Math.random() * 5)]
    };
    
    setUserState({
      isSignedIn: true,
      user: newUser,
      stories: [],
      currentStoryId: null
    });
    
    saveUserData(newUser, []);
    logger.userAction('user_account_created', { name, email });
    
    return newUser;
  };

  // Save current story
  const saveCurrentStory = () => {
    if (!userState.isSignedIn || !userContent.title) return;
    
    const story = {
      id: userState.currentStoryId || Date.now(),
      title: userContent.title,
      format: appState.selectedStyle,
      content: userContent.story,
      enhancedContent: enhancementState.enhancementResult?.enhanced || null,
      createdAt: userState.currentStoryId 
        ? userState.stories.find(s => s.id === userState.currentStoryId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: userContent.story.split(' ').length,
      status: enhancementState.enhancementResult?.approved ? 'completed' : 'draft'
    };
    
    const updatedStories = userState.currentStoryId 
      ? userState.stories.map(s => s.id === userState.currentStoryId ? story : s)
      : [...userState.stories, story];
    
    setUserState(prev => ({
      ...prev,
      stories: updatedStories,
      currentStoryId: story.id
    }));
    
    saveUserData(userState.user, updatedStories);
    logger.userAction('story_saved', { 
      storyId: story.id, 
      title: story.title,
      wordCount: story.wordCount 
    });
  };

  // Load existing story
  const loadStory = (storyId) => {
    const story = userState.stories.find(s => s.id === storyId);
    if (!story) return;
    
    updateUserContent({
      title: story.title,
      story: story.content
    });
    
    updateAppState({
      selectedStyle: story.format,
      currentStep: 'conversation',
      currentStage: 'storytelling',
      showNotebook: true,
      showTitle: true
    });
    
    if (story.enhancedContent) {
      updateEnhancementState({
        enhancementResult: {
          original: story.content,
          enhanced: story.enhancedContent,
          approved: story.status === 'completed'
        }
      });
    }
    
    setUserState(prev => ({
      ...prev,
      currentStoryId: storyId
    }));
    
    logger.userAction('story_loaded', { storyId, title: story.title });
  };

  // Sign out user
  const signOut = () => {
    localStorage.removeItem('auramythos_user');
    localStorage.removeItem('auramythos_stories');
    
    setUserState({
      isSignedIn: false,
      user: null,
      stories: [],
      currentStoryId: null
    });
    
    // Reset app to landing page
    updateAppState({
      currentStep: 'landing',
      currentStage: 'naming',
      selectedStyle: null,
      showNotebook: false,
      showTitle: false
    });
    
    updateUserContent({
      input: '',
      name: '',
      title: '',
      story: ''
    });
    
    updateConversationState({
      messages: [],
      currentTyping: '',
      isTyping: false,
      awaitingInput: false
    });
    
    logger.userAction('user_signed_out');
  };

  // Check backend connection on startup (after all functions are defined)
  useEffect(() => {
    const checkBackend = async () => {
      console.log('🔍 Checking backend connection...');
      const health = await apiClient.checkHealth();
      
      setBackendState({
        connected: health.status === 'OK',
        health,
        lastCheck: new Date().toISOString()
      });
      
      if (health.status === 'OK') {
        console.log('✅ Backend connected successfully!');
      } else {
        console.warn('⚠️ Backend offline, using demo mode');
      }
    };
    
    checkBackend();
  }, []);
  
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

  // NEW: Corner navigation handler
  const handleCornerNavClick = (buttonId, action) => {
    logger.userAction('corner_nav_interaction', { buttonId, action });
    
    // Update active button state
    setCornerNavState(prev => ({
      ...prev,
      activeButton: prev.activeButton === buttonId ? null : buttonId
    }));
    
    switch (action) {
      case 'goBack':
        handleGoBack();
        break;
        
      case 'viewStats':
        // Navigate to stats page
        updateAppState({ currentStep: 'stats' });
        logger.success('Navigated to stats page');
        break;
        
      case 'uploadFile':
        // Handle file upload
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt,.md,.doc,.docx';
        fileInput.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            logger.userAction('file_upload_initiated', { 
              filename: file.name, 
              size: file.size 
            });
            // Add your file processing logic here
          }
        };
        fileInput.click();
        break;
        
      case 'openSettings':
        // Handle settings
        logger.info('Settings clicked - implement settings modal');
        // You can add a settings modal here
        break;
        
      default:
        logger.warn('Unknown corner nav action:', action);
    }
  };

  // NEW: Smart back navigation function
  const handleGoBack = () => {
    logger.userAction('back_button_clicked', { 
      currentStep: appState.currentStep,
      currentStage: appState.currentStage,
      isSignedIn: userState.isSignedIn
    });

    if (appState.currentStep === 'conversation') {
      // Save current story progress if user is signed in
      if (userState.isSignedIn && (userContent.title || userContent.story)) {
        saveCurrentStory();
        logger.success('Story progress saved before going back');
      }
      
      // Determine where to go back to based on user state
      if (userState.isSignedIn) {
        // Signed in users go back to dashboard
        updateAppState({ 
          currentStep: 'dashboard',
          isTransitioning: false 
        });
        logger.debug('Navigating back to dashboard');
      } else {
        // Non-signed in users go back to auth screen
        updateAppState({ 
          currentStep: 'auth',
          isTransitioning: false 
        });
        logger.debug('Navigating back to auth screen');
      }
      
      // Clear conversation state
      updateConversationState({
        messages: [],
        currentTyping: '',
        isTyping: false,
        awaitingInput: false
      });
      
      // Reset enhancement state
      updateEnhancementState({
        isEnhancing: false,
        showMagicalLoading: false,
        enhancementResult: null,
        awaitingApproval: false
      });
      
    } else if (appState.currentStep === 'stats') {
      // From stats, go back to dashboard
      updateAppState({ currentStep: 'dashboard' });
      logger.debug('Navigating back to dashboard from stats');
      
    } else if (appState.currentStep === 'dashboard') {
      // From dashboard, go back to landing page
      signOut(); // This already handles going back to landing
      logger.debug('Navigating back to landing page');
    }
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

  // Enhanced Let's Begin - check for returning users
  const handleLetsBegin = () => {
    logger.userAction('lets_begin_clicked', { 
      isReturningUser: userState.isSignedIn,
      storiesCount: userState.stories.length 
    });
    
    if (userState.isSignedIn && userState.stories.length > 0) {
      // Show dashboard for returning users
      updateAppState({ 
        currentStep: 'dashboard',
        isTransitioning: false 
      });
    } else if (userState.isSignedIn) {
      // Signed in user with no stories - go straight to story creation
      updateAppState({ isTransitioning: true });
      
      setTimeout(() => {
        updateAppState({ 
          currentStep: 'conversation',
          showNotebook: false
        });
        
        setTimeout(() => {
          // Use saved name for returning users
          updateUserContent({ name: userState.user.name });
          
          refs.messageQueue.current = [
            { text: `Welcome back, ${userState.user.name}! ✨`, delay: 500 },
            { text: "Ready to create your next story?", delay: 800 },
            { text: "Let's give your story a title. What would you like to call it?", delay: 1000 },
            { type: 'input', placeholder: isMobile ? "Tap the microphone to say your title..." : "Type your story title...", delay: 1000 }
          ];
          processMessageQueue();
          
          updateAppState({ 
            currentStage: 'story_type_selection',
            showNotebook: true
          });
          
          setTimeout(() => {
            updateAppState({ isTransitioning: false });
            logger.success('Returning user transition complete');
          }, 500);
        }, 200);
      }, 800);
    } else {
      // New user - show sign up/sign in options
      updateAppState({ 
        currentStep: 'auth',
        isTransitioning: false 
      });
    }
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
  // ENHANCED STORY FUNCTION WITH REAL BACKEND INTEGRATION
  // ============================================================================
  const enhanceStory = async () => {
    logger.userAction('enhance_story_start', {
      originalLength: userContent.story.length,
      originalWordCount: userContent.story.split(' ').length,
      format: appState.selectedStyle,
      backendConnected: backendState.connected
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
    
    let enhancedStory;
    let isDemo = false;
    
    try {
      if (backendState.connected) {
        // Use real backend API
        console.log('🤖 Using real AI backend for enhancement...');
        
        const result = await apiClient.enhanceStory(
          userContent.story, 
          appState.selectedStyle,
          {
            previousContext: '',
            conversationHistory: []
          }
        );
        
        if (result && result.success) {
          enhancedStory = result.enhanced || result.continuation;
          isDemo = result.demo || false;
          
          console.log('✅ Real AI enhancement completed:', {
            provider: result.provider,
            outputLength: enhancedStory.length,
            demo: isDemo
          });
        } else {
          throw new Error('Backend returned unsuccessful result');
        }
      } else {
        throw new Error('Backend not connected');
      }
    } catch (error) {
      console.warn('⚠️ Backend failed, using fallback enhancement:', error.message);
      
      // Fallback to your original enhancement system
      enhancedStory = generateEnhancedStory(userContent.story, appState.selectedStyle);
      isDemo = true;
    }
    
    // Wait for magical loading (15 seconds for dramatic effect)
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Remove magical loading
    setConversationState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.type !== 'magical_loading')
    }));
    
    // Store the enhancement result
    updateEnhancementState({ 
      enhancementResult: {
        original: userContent.story,
        enhanced: enhancedStory,
        approved: false,
        isDemo
      },
      awaitingApproval: true,
      isEnhancing: false,
      showMagicalLoading: false
    });
    
    logger.userAction('enhance_story_complete', {
      enhancedLength: enhancedStory.length,
      enhancedWordCount: enhancedStory.split(' ').length,
      improvement: `${enhancedStory.split(' ').length - userContent.story.split(' ').length} words added`,
      format: appState.selectedStyle,
      backendUsed: backendState.connected && !isDemo,
      isDemo
    });
    
    // Add enhanced result with approval system (appears instantly)
    addEnhancementResult(enhancedStory);
    
    // Aura asks for approval with backend status
    const approvalMessage = backendState.connected && !isDemo 
      ? `✨ How does this AI-enhanced version look, ${userContent.name || 'my friend'}?`
      : `✨ How does this enhanced version look, ${userContent.name || 'my friend'}? ${isDemo ? '(Demo mode)' : ''}`;
    
    queueMessages([
      { text: approvalMessage, delay: 1000 }
    ]);
  };

  // NEW: Handle approval/denial of enhancement with export functionality
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
      
      // Add export buttons after approval
      queueMessages([
        { text: "🎉 Wonderful! Your enhanced story is ready!", delay: 800 },
        { text: backendState.connected 
          ? "Your story was enhanced with real AI! You can now export it or continue writing." 
          : "In the full version, you'd get even better AI enhancements and export options!", delay: 1000 },
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

  // NEW: Export functionality
  const exportStory = (format = 'txt') => {
    const story = enhancementState.enhancementResult?.enhanced || userContent.story;
    const title = userContent.title || 'My Story';
    
    logger.userAction('export_story', { format, length: story.length });
    
    if (format === 'txt') {
      const content = `${title}\nCreated with AuraMythos.ai\n\n${story}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'copy') {
      navigator.clipboard.writeText(story).then(() => {
        console.log('📋 Story copied to clipboard');
      });
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
      {/* AUDIOPEN-STYLE CORNER NAVIGATION - MOVED OUTSIDE ALL CONTAINERS */}
      <CornerNavigation 
        onButtonClick={handleCornerNavClick}
        activeButton={cornerNavState.activeButton}
        isVisible={cornerNavState.showCornerNav && appState.currentStep !== 'landing'}
        currentStep={appState.currentStep}
      />

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

        {/* AUDIOPEN-STYLE CORNER NAVIGATION - REMOVED FROM HERE */}
        
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
            {/* Backend Status Indicator */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '8px 12px',
              background: backendState.connected 
                ? 'rgba(34, 197, 94, 0.2)' 
                : 'rgba(239, 68, 68, 0.2)',
              borderRadius: '20px',
              border: `1px solid ${backendState.connected ? '#22c55e' : '#ef4444'}`,
              fontSize: '12px',
              fontWeight: '600',
              color: backendState.connected ? '#16a34a' : '#dc2626',
              backdropFilter: 'blur(10px)'
            }}>
              {backendState.connected ? '🤖 AI Ready' : '⚠️ Demo Mode'}
            </div>
            
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

        {/* AUTH SCREEN - AudioPen-Inspired Welcome */}
        {appState.currentStep === 'auth' && (
          <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: '40px 20px',
            paddingTop: '80px' // Space for corner buttons
          }}>
            {/* Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '48px',
              maxWidth: '600px',
              margin: '0 auto 48px'
            }}>
              <h1 style={{
                fontSize: isMobile ? '2.5rem' : '3.5rem',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0 0 16px 0',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                AuraMythos
              </h1>
              
              <p style={{
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                color: '#64748b',
                margin: '0 0 8px 0',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                Go from fuzzy thought to clear story. <em style={{ color: '#667eea' }}>Fast.</em>
              </p>
              
              <p style={{
                fontSize: '16px',
                color: '#94a3b8',
                margin: 0,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                AuraMythos transforms voice notes into stories that are easy to read and ready to share.
              </p>
            </div>

            {/* Sample Story Cards - AudioPen Style */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              maxWidth: '1200px',
              margin: '0 auto 48px',
              opacity: 0.7
            }}>
              {/* Sample Card 1 */}
              <div style={{
                background: '#fefefe',
                border: '1px solid #e2e8f0',
                borderRadius: '4px', // Square corners like AudioPen
                padding: '20px',
                minHeight: '140px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    The Dragon's Last Song
                  </h3>
                  <span style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    you
                  </span>
                </div>
                
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  lineHeight: '1.5',
                  margin: '0 0 auto 0',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  In the misty mountains where ancient magic still flows, a dragon prepares for her final flight...
                </p>
                
                <div style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  marginTop: '12px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Aug 1, 2025
                </div>
              </div>

              {/* Sample Card 2 */}
              <div style={{
                background: '#fefefe',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                padding: '20px',
                minHeight: '140px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    Coffee Shop Chronicles
                  </h3>
                  <span style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    you
                  </span>
                </div>
                
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  lineHeight: '1.5',
                  margin: '0 0 auto 0',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Every morning at 7:43 AM, she orders the same thing. Today, something different happens...
                </p>
                
                <div style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  marginTop: '12px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Jul 28, 2025
                </div>
              </div>

              {/* Sample Card 3 */}
              <div style={{
                background: '#fefefe',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                padding: '20px',
                minHeight: '140px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    Building Tomorrow
                  </h3>
                  <span style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    you
                  </span>
                </div>
                
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  lineHeight: '1.5',
                  margin: '0 0 auto 0',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  A young architect discovers blueprints for a building that changes the laws of physics...
                </p>
                
                <div style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  marginTop: '12px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Jul 25, 2025
                </div>
              </div>

              {/* Sample Card 4 - Only on desktop */}
              {!isMobile && (
                <div style={{
                  background: '#fefefe',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  padding: '20px',
                  minHeight: '140px',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1e293b',
                      margin: 0,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      Midnight Express
                    </h3>
                    <span style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      you
                    </span>
                  </div>
                  
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    lineHeight: '1.5',
                    margin: '0 0 auto 0',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    The last train out of the city carries more than passengers tonight...
                  </p>
                  
                  <div style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    marginTop: '12px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    Jul 22, 2025
                  </div>
                </div>
              )}
            </div>

            {/* Sign Up Section - Simplified */}
            <div style={{
              maxWidth: '400px',
              margin: '0 auto',
              textAlign: 'center'
            }}>
              <input
                type="text"
                placeholder="Enter your name..."
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  background: '#fafbfc',
                  color: '#1e293b',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                  marginBottom: '16px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    const user = createUserAccount(e.target.value.trim());
                    setTimeout(() => {
                      updateAppState({ currentStep: 'dashboard' });
                    }, 300);
                  }
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.background = '#ffffff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.background = '#fafbfc';
                }}
              />

              <button
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: '#1e293b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  marginBottom: '24px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#0f172a';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#1e293b';
                }}
                onClick={(e) => {
                  const input = e.target.parentElement.querySelector('input');
                  if (input && input.value.trim()) {
                    const user = createUserAccount(input.value.trim());
                    setTimeout(() => {
                      updateAppState({ currentStep: 'dashboard' });
                    }, 300);
                  }
                }}
              >
                Get started
              </button>

              <p style={{
                fontSize: '12px',
                color: '#94a3b8',
                margin: 0,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                Stories saved locally in your browser. Perfect for trying out AuraMythos.
              </p>
            </div>
          </div>
        )}

        {/* STATS PAGE - New Dedicated Stats Screen */}
        {appState.currentStep === 'stats' && (
          <div style={{
            minHeight: '100vh',
            width: '100%',
            background: '#f1f5f9',
            padding: '40px 20px',
            paddingTop: '80px',
            overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{
              maxWidth: '800px',
              margin: '0 auto 40px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                margin: '0 auto 24px',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)'
              }}>
                🏆
              </div>
              
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0 0 8px 0',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                Your Writing Journey
              </h1>
              
              <p style={{
                fontSize: '1.1rem',
                color: '#64748b',
                margin: '0 0 16px 0',
                fontStyle: 'italic',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                Track your progress and celebrate your achievements
              </p>

              <p style={{
                fontSize: '14px',
                color: '#94a3b8',
                margin: 0,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                Member since {userState.user ? new Date(userState.user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
              </p>
            </div>

            {/* Main Stats Grid */}
            <div style={{
              maxWidth: '800px',
              margin: '0 auto 40px',
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '24px'
            }}>
              {/* Stories Created */}
              <div style={{
                background: 'white',
                padding: '40px 32px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  fontSize: '20px'
                }}>
                  📚
                </div>
                
                <div style={{ 
                  fontSize: '3.5rem', 
                  fontWeight: '800', 
                  color: '#667eea',
                  margin: '0 0 12px 0',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  {userState.stories.length}
                </div>
                
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 8px 0',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Stories Created
                </h3>
                
                <p style={{ 
                  color: '#64748b',
                  fontSize: '14px',
                  margin: 0,
                  fontStyle: 'italic',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Every story starts with a single idea
                </p>
              </div>
              
              {/* Words Written */}
              <div style={{
                background: 'white',
                padding: '40px 32px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  fontSize: '20px'
                }}>
                  ✍️
                </div>
                
                <div style={{ 
                  fontSize: '3.5rem', 
                  fontWeight: '800', 
                  color: '#10b981',
                  margin: '0 0 12px 0',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  {userState.stories.reduce((total, story) => total + story.wordCount, 0).toLocaleString()}
                </div>
                
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 8px 0',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Words Written
                </h3>
                
                <p style={{ 
                  color: '#64748b',
                  fontSize: '14px',
                  margin: 0,
                  fontStyle: 'italic',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  The building blocks of great stories
                </p>
              </div>
              
              {/* Enhanced Stories */}
              <div style={{
                background: 'white',
                padding: '40px 32px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  fontSize: '20px'
                }}>
                  ✨
                </div>
                
                <div style={{ 
                  fontSize: '3.5rem', 
                  fontWeight: '800', 
                  color: '#8b5cf6',
                  margin: '0 0 12px 0',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  {userState.stories.filter(s => s.status === 'completed').length}
                </div>
                
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 8px 0',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Enhanced Stories
                </h3>
                
                <p style={{ 
                  color: '#64748b',
                  fontSize: '14px',
                  margin: 0,
                  fontStyle: 'italic',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Transformed with AI magic
                </p>
              </div>
            </div>

            {/* Additional Stats */}
            <div style={{
              maxWidth: '800px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '24px'
            }}>
              {/* Average Words per Story */}
              <div style={{
                background: 'white',
                padding: '32px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 16px 0',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  📊 Writing Insights
                </h3>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{
                    color: '#64748b',
                    fontSize: '14px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    Average words per story
                  </span>
                  <span style={{
                    color: '#1e293b',
                    fontSize: '16px',
                    fontWeight: '600',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    {userState.stories.length > 0 
                      ? Math.round(userState.stories.reduce((total, story) => total + story.wordCount, 0) / userState.stories.length)
                      : 0
                    }
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    color: '#64748b',
                    fontSize: '14px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    Completion rate
                  </span>
                  <span style={{
                    color: '#1e293b',
                    fontSize: '16px',
                    fontWeight: '600',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    {userState.stories.length > 0 
                      ? Math.round((userState.stories.filter(s => s.status === 'completed').length / userState.stories.length) * 100)
                      : 0
                    }%
                  </span>
                </div>
              </div>

              {/* Recent Activity */}
              <div style={{
                background: 'white',
                padding: '32px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 16px 0',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  🕐 Recent Activity
                </h3>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{
                    color: '#64748b',
                    fontSize: '14px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    Last story created
                  </span>
                  <span style={{
                    color: '#1e293b',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    {userState.stories.length > 0 
                      ? new Date(Math.max(...userState.stories.map(s => new Date(s.createdAt)))).toLocaleDateString()
                      : 'None yet'
                    }
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    color: '#64748b',
                    fontSize: '14px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    Most productive day
                  </span>
                  <span style={{
                    color: '#1e293b',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    {userState.stories.length > 0 ? 'Today' : 'Start writing!'}
                  </span>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            {userState.stories.length === 0 && (
              <div style={{
                maxWidth: '400px',
                margin: '40px auto 0',
                textAlign: 'center',
                background: 'white',
                padding: '40px 32px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚀</div>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 8px 0',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Ready to start your journey?
                </h3>
                <p style={{
                  color: '#64748b',
                  margin: '0 0 24px 0',
                  fontSize: '14px',
                  fontStyle: 'italic',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Your first story is just a conversation away
                </p>
                <button
                  onClick={() => {
                    updateAppState({ currentStep: 'dashboard' });
                  }}
                  style={{
                    padding: '12px 24px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        )}

        {/* DASHBOARD SCREEN - Clean Design */}
        {appState.currentStep === 'dashboard' && (
          <div style={{
            minHeight: '100vh',
            width: '100%',
            background: '#f1f5f9', // Light gray background like the image
            padding: '40px 20px',
            paddingTop: '80px',
            overflowY: 'auto'
          }}>
            {/* Header with avatar and welcome message */}
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto 40px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '40px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: userState.user?.avatarColor || '#667eea',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: '600',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    {userState.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 style={{
                      fontSize: '1.8rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      margin: '0 0 4px 0',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      Welcome back, {userState.user?.name}! 👋
                    </h1>
                    <p style={{ 
                      color: '#64748b', 
                      margin: 0,
                      fontSize: '16px',
                      fontStyle: 'italic',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      Ready to continue your storytelling journey?
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={signOut}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
            
            {/* Stories Section */}
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: 0,
                  fontStyle: 'italic',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Your Stories
                </h2>
                
                <button
                  onClick={() => {
                    updateAppState({ 
                      currentStep: 'conversation',
                      currentStage: 'story_type_selection',
                      showNotebook: false
                    });
                    
                    setTimeout(() => {
                      refs.messageQueue.current = [
                        { text: "Let's create a new story! What would you like to call it?", delay: 500 },
                        { type: 'input', placeholder: isMobile ? "Tap the microphone to say your title..." : "Type your story title...", delay: 800 }
                      ];
                      processMessageQueue();
                      updateAppState({ showNotebook: true });
                    }, 500);
                  }}
                  style={{
                    padding: '12px 20px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#5a67d8'}
                  onMouseLeave={(e) => e.target.style.background = '#667eea'}
                >
                  + New Story
                </button>
              </div>

              {/* 3 Rows of Faint Background Cards - AudioPen Style */}
              <div style={{
                position: 'relative',
                minHeight: '500px'
              }}>
                {/* Background gradient cards - 3 rows */}
                {[...Array(3)].map((_, rowIndex) => (
                  <div key={`row-${rowIndex}`} style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px',
                    marginBottom: '16px',
                    opacity: 0.25 - (rowIndex * 0.03) // Made 10% more visible (was 0.15)
                  }}>
                    {[...Array(isMobile ? 1 : 4)].map((_, cardIndex) => (
                      <div key={`card-${rowIndex}-${cardIndex}`} style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.3) 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        borderRadius: '12px',
                        minHeight: '140px',
                        backdropFilter: 'blur(10px)',
                        pointerEvents: 'none'
                      }} />
                    ))}
                  </div>
                ))}

                {/* Actual Story Cards (on top of background cards) - Notecard Style */}
                {userState.stories.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px' // Increased gap for tilted cards
                  }}>
                    {userState.stories.map((story, index) => {
                      // Different rotation angles for each card
                      const rotations = ['-2deg', '1deg', '-1deg', '2deg', '-1.5deg', '1.5deg'];
                      const rotation = rotations[index % rotations.length];
                      
                      return (
                        <div
                          key={story.id}
                          style={{
                            position: 'relative',
                            transform: `rotate(${rotation})`,
                            transformOrigin: 'center center'
                          }}
                        >
                          {/* Red Pin */}
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '12px',
                            height: '12px',
                            background: 'radial-gradient(circle, #dc2626 0%, #991b1b 100%)',
                            borderRadius: '50%',
                            zIndex: 10,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                            border: '1px solid #7f1d1d'
                          }} />
                          
                          {/* Pin Shadow */}
                          <div style={{
                            position: 'absolute',
                            top: '16px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '8px',
                            height: '8px',
                            background: 'rgba(0,0,0,0.1)',
                            borderRadius: '50%',
                            zIndex: 1
                          }} />
                          
                          {/* Notecard */}
                          <div
                            style={{
                              background: `
                                linear-gradient(to right, #ffb3ba 0px, #ffb3ba 2px, transparent 2px),
                                repeating-linear-gradient(
                                  transparent,
                                  transparent 23px,
                                  #e0e7ff 23px,
                                  #e0e7ff 24px
                                ),
                                #fefefe
                              `,
                              backgroundSize: '100% 100%, 100% 100%, 100% 100%',
                              padding: '32px 24px 24px 32px', // Extra top padding for pin
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              minHeight: '160px',
                              display: 'flex',
                              flexDirection: 'column',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              position: 'relative',
                              fontFamily: "'Special Elite', 'Courier New', monospace" // Handwritten font
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-4px) scale(1.02)';
                              e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0) scale(1)';
                              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                            }}
                            onClick={() => loadStory(story.id)}
                          >
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '12px'
                            }}>
                              <h3 style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#1e293b',
                                margin: 0,
                                lineHeight: '1.3',
                                fontFamily: "'Special Elite', 'Courier New', monospace"
                              }}>
                                {story.title}
                              </h3>
                              <span style={{
                                fontSize: '12px',
                                color: '#6b7280',
                                fontFamily: "'Special Elite', 'Courier New', monospace"
                              }}>
                                you
                              </span>
                            </div>
                            
                            <p style={{
                              color: '#4b5563',
                              fontSize: '14px',
                              lineHeight: '24px', // Match line spacing
                              margin: '0 0 auto 0',
                              fontFamily: "'Special Elite', 'Courier New', monospace"
                            }}>
                              {story.content.substring(0, 100)}...
                            </p>
                            
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginTop: '16px',
                              fontSize: '11px',
                              color: '#6b7280',
                              fontFamily: "'Special Elite', 'Courier New', monospace"
                            }}>
                              <span>{story.format.charAt(0).toUpperCase() + story.format.slice(1)}</span>
                              <span>{new Date(story.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
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
                      
                      {/* Export buttons after approval */}
                      {enhancementState.enhancementResult?.approved && (
                        <div style={{ marginTop: '16px' }}>
                          <div className="approval-buttons">
                            <button 
                              className="approval-btn approve" 
                              onClick={() => exportStory('txt')}
                            >
                              📄 Download
                            </button>
                            <button 
                              className="approval-btn approve" 
                              onClick={() => exportStory('copy')}
                            >
                              📋 Copy
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