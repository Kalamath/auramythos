import React, { useState, useRef, useEffect } from 'react';

// ============================================================================
// ENHANCED LOGGING SYSTEM
// ============================================================================
const logger = {
  isDev: true,
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
  userAction: (action, data = {}) => {
    if (logger.isDev) {
      console.log('👤 [USER ACTION]', action, data);
    }
  },
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
// TESTIMONIALS DATA
// ============================================================================
const testimonialData = [
  {
    id: 1,
    name: "Otis Frampton",
    handle: "@otisframpton",
    avatar: "O",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    rating: 5,
    text: "I can't say enough good things about AuraMythos. It's been my go-to app for getting ideas down without having to type. Not only does it arrange even the most inarticulate nonsense into readable sentences, it's the best dictation app I've ever used.",
    highlight: "best dictation app ever"
  },
  {
    id: 2,
    name: "Sarah Mitchell",
    handle: "@sarahmitchell",
    avatar: "S",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    rating: 5,
    text: "AuraMythos transformed my writing process completely. What used to take me hours now takes minutes. The AI perfectly captures my voice while making everything sound more polished. Absolute game-changer!",
    highlight: "absolute game-changer"
  },
  {
    id: 3,
    name: "Michael Chen",
    handle: "@mchen_writes",
    avatar: "M",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    rating: 5,
    text: "As a screenwriter, I'm always capturing ideas on the go. AuraMythos lets me speak my scenes and instantly get properly formatted scripts. It's like having a professional writing assistant in my pocket!",
    highlight: "professional assistant"
  },
  {
    id: 4,
    name: "Emily Rodriguez",
    handle: "@emily_storyteller",
    avatar: "E",
    gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    rating: 5,
    text: "I've tried every writing app out there. AuraMythos is different - it actually understands storytelling. The way it enhances my rough ideas into compelling narratives feels like magic. Worth every penny!",
    highlight: "feels like magic"
  },
  {
    id: 5,
    name: "James Thompson",
    handle: "@jthompson",
    avatar: "J",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    rating: 5,
    text: "I'm not a 'natural' writer, but AuraMythos makes me feel like one. I just talk about my ideas and it turns them into beautiful stories. My blog engagement has tripled since I started using it!",
    highlight: "engagement tripled"
  },
  {
    id: 6,
    name: "Ava Patel",
    handle: "@avawrites",
    avatar: "A",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    rating: 5,
    text: "The comic book feature is incredible! I describe my scenes and AuraMythos automatically creates panel layouts with perfect pacing. It's cut my production time in half. My readers love the quality!",
    highlight: "50% faster"
  },
  {
    id: 7,
    name: "David Kim",
    handle: "@davidkim_author",
    avatar: "D",
    gradient: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
    rating: 5,
    text: "Finally, an AI that gets creative writing! It doesn't just fix grammar - it understands narrative flow, character development, and emotional beats. AuraMythos has become essential to my workflow.",
    highlight: "essential tool"
  },
  {
    id: 8,
    name: "Laura Lake",
    handle: "@lauralake",
    avatar: "L",
    gradient: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
    rating: 5,
    text: "The beauty of AuraMythos is in its simplicity. I love how easy it is to write what I'm thinking. And now with the new 'write like me' feature it reduces editing time by a tremendous amount.",
    highlight: "beautifully simple"
  },
  {
    id: 9,
    name: "Robert Anderson",
    handle: "@robwrites",
    avatar: "R",
    gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    rating: 5,
    text: "As someone with ADHD, getting thoughts onto paper has always been a struggle. AuraMythos lets me brain-dump verbally and turns it into coherent writing. It's been life-changing for my productivity.",
    highlight: "life-changing"
  }
];

// ============================================================================
// CORNER NAVIGATION COMPONENT
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
      showOn: ['app', 'conversation', 'dashboard', 'stats', 'auth']
    },
    { 
      id: 'login', 
      icon: '👤', 
      position: 'topRight',
      label: 'Login',
      action: 'login',
      showOn: ['marketing']
    },
    { 
      id: 'settings', 
      icon: '⚙️', 
      position: 'topRight',
      label: 'Settings',
      action: 'openSettings',
      showOn: ['conversation', 'dashboard', 'stats']
    },
    { 
      id: 'demo', 
      icon: '🎬', 
      position: 'bottomLeft',
      label: 'Watch Demo',
      action: 'watchDemo',
      showOn: ['marketing']
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
      id: 'pricing', 
      icon: '💎', 
      position: 'bottomRight',
      label: 'Pricing',
      action: 'pricing',
      showOn: ['marketing']
    },
    { 
      id: 'stats', 
      icon: '🏆', 
      position: 'bottomRight',
      label: 'Your Stats',
      action: 'viewStats',
      showOn: ['dashboard']
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
    
    ...(position === 'topLeft' && { top: '20px', left: '20px' }),
    ...(position === 'topRight' && { top: '20px', right: '20px' }),
    ...(position === 'bottomLeft' && { bottom: '20px', left: '20px' }),
    ...(position === 'bottomRight' && { bottom: '20px', right: '20px' }),
    
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
            className="corner-button"
          >
            {button.icon}
          </button>
        );
      })}
    </>
  );
};

// ============================================================================
// TESTIMONIALS COMPONENT
// ============================================================================
function TestimonialsSection({ isMobile }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const testimonialsPerView = isMobile ? 1 : 3;
  const autoScrollDelay = 4000;
  
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      handleNext();
    }, autoScrollDelay);
    
    return () => clearInterval(interval);
  }, [currentIndex, isPaused]);
  
  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % testimonialData.length);
    setTimeout(() => setIsAnimating(false), 300);
  };
  
  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + testimonialData.length) % testimonialData.length);
    setTimeout(() => setIsAnimating(false), 300);
  };
  
  const getVisibleTestimonials = () => {
    const visibleItems = [];
    for (let i = 0; i < testimonialsPerView; i++) {
      const index = (currentIndex + i) % testimonialData.length;
      visibleItems.push(testimonialData[index]);
    }
    return visibleItems;
  };
  
  const handleDotClick = (index) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 300);
  };
  
  return (
    <div style={{
      padding: '80px 20px',
      background: 'white',
      borderTop: '1px solid #e2e8f0',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: '600',
            color: '#1e293b',
            margin: '0 0 12px 0'
          }}>
            Loved by storytellers worldwide
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: '#64748b',
            margin: 0
          }}>
            Join thousands of writers who've transformed their creative process
          </p>
        </div>
        
        <div 
          style={{
            position: 'relative',
            padding: isMobile ? '0' : '0 60px',
            marginBottom: '40px'
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {!isMobile && (
            <button
              onClick={handlePrev}
              style={{
                position: 'absolute',
                left: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'white',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              ←
            </button>
          )}
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '24px',
            transition: 'transform 0.3s ease'
          }}>
            {getVisibleTestimonials().map((testimonial) => (
              <div
                key={testimonial.id}
                style={{
                  background: '#fafbfc',
                  borderRadius: '16px',
                  padding: '28px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  transition: 'all 0.3s ease',
                  cursor: 'default',
                  transform: isAnimating ? 'scale(0.95)' : 'scale(1)',
                  opacity: isAnimating ? 0.5 : 1,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: testimonial.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '18px',
                    flexShrink: 0
                  }}>
                    {testimonial.avatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '600',
                      color: '#1e293b',
                      fontSize: '15px'
                    }}>
                      {testimonial.name}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#94a3b8'
                    }}>
                      {testimonial.handle}
                    </div>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '3px',
                  fontSize: '16px'
                }}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} style={{ color: '#fbbf24' }}>★</span>
                  ))}
                </div>
                
                <p style={{
                  fontSize: '14px',
                  color: '#475569',
                  lineHeight: '1.7',
                  margin: 0,
                  flex: 1
                }}>
                  "{testimonial.text}"
                </p>
                
                {testimonial.highlight && (
                  <div style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'white',
                    textAlign: 'center',
                    alignSelf: 'flex-start'
                  }}>
                    {testimonial.highlight}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {!isMobile && (
            <button
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'white',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              →
            </button>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '32px'
        }}>
          {testimonialData.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              style={{
                width: currentIndex === index ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: currentIndex === index 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : '#cbd5e1',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0
              }}
            />
          ))}
        </div>
        
        <div style={{
          marginTop: '60px',
          padding: '32px',
          background: 'linear-gradient(135deg, #fafbfc 0%, #f7f9fc 100%)',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '32px',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              50,000+
            </div>
            <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Active Writers</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              4.9/5
            </div>
            <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Average Rating</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              2M+
            </div>
            <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Stories Created</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
  const [isMobile, setIsMobile] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [currentPage, setCurrentPage] = useState('marketing');
  const [cornerNavState, setCornerNavState] = useState({
    activeButton: null,
    showCornerNav: true
  });
  
  // App state from full component
  const [appState, setAppState] = useState({
    currentStep: 'landing',
    currentStage: 'naming',
    isTransitioning: false,
    selectedStyle: null,
    showNotebook: false,
    showTitle: false
  });
  
  // User state
  const [userState, setUserState] = useState({
    isSignedIn: false,
    user: null,
    stories: [],
    currentStoryId: null
  });
  
  // User content
  const [userContent, setUserContent] = useState({
    input: '',
    name: '',
    title: '',
    story: '',
    branches: [],
    currentBranch: 'main'
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
  
  // Recording state
  const [recordingState, setRecordingState] = useState({
    isRecording: false,
    isSupported: false,
    showMicrophone: false
  });
  
  // Enhancement state
  const [enhancementState, setEnhancementState] = useState({
    isEnhancing: false,
    showMagicalLoading: false,
    enhancementResult: null,
    awaitingApproval: false
  });
  
  // Backend state
  const [backendState, setBackendState] = useState({
    connected: false,
    health: null,
    lastCheck: null
  });
  
  // Refs
  const refs = {
    messagesEnd: useRef(null),
    messageQueue: useRef([]),
    isProcessingQueue: useRef(false),
    textInput: useRef(null),
    typingInProgress: useRef(null),
    recognition: useRef(null),
    lastProcessedIndex: useRef(0)
  };
  
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    setTimeout(() => setBackendConnected(true), 1000);
    
    // Load saved user data
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
    }
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // State update helpers
  const updateAppState = (updates) => {
    logger.debug('App state update:', updates);
    setAppState(prev => ({ ...prev, ...updates }));
  };
  
  const updateUserContent = (updates) => {
    logger.debug('User content update:', Object.keys(updates));
    setUserContent(prev => ({ ...prev, ...updates }));
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
  
  const updateRecordingState = (updates) => {
    logger.debug('Recording state update:', updates);
    setRecordingState(prev => ({ ...prev, ...updates }));
  };
  
  const updateEnhancementState = (updates) => {
    logger.debug('Enhancement state update:', updates);
    setEnhancementState(prev => ({ ...prev, ...updates }));
  };

  // User management functions
  const saveUserData = (user, stories) => {
    localStorage.setItem('auramythos_user', JSON.stringify(user));
    localStorage.setItem('auramythos_stories', JSON.stringify(stories));
  };
  
  const createUserAccount = (name) => {
    const newUser = {
      id: Date.now(),
      name,
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
    return newUser;
  };
  
  const signOut = () => {
    localStorage.removeItem('auramythos_user');
    localStorage.removeItem('auramythos_stories');
    
    setUserState({
      isSignedIn: false,
      user: null,
      stories: [],
      currentStoryId: null
    });
    
    setCurrentPage('marketing');
  };

  // Message queue processing
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
      } else if (message.type === 'story_choices') {
        addStoryChoices();
      } else {
        await addSystemMessage(message.text);
      }
    }
    
    refs.isProcessingQueue.current = false;
  };
  
  const queueMessages = (messages) => {
    refs.messageQueue.current.push(...messages);
    processMessageQueue();
  };
  
  const typeMessage = async (text, callback) => {
    if (refs.typingInProgress.current) return;
    
    refs.typingInProgress.current = true;
    updateConversationState({ isTyping: true, currentTyping: '' });
    
    for (let i = 0; i <= text.length; i++) {
      if (!refs.typingInProgress.current) {
        updateConversationState({ currentTyping: text });
        break;
      }
      
      updateConversationState({ currentTyping: text.slice(0, i) });
      await new Promise(resolve => setTimeout(resolve, isMobile ? 15 : 30));
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
    logger.userAction('user_message_added', { length: text.length, preview: text.substring(0, 30) });
  };
  
  const addInputPrompt = (placeholder) => {
    setConversationState(prev => ({ 
      ...prev,
      messages: [...prev.messages, { type: 'input', placeholder, timestamp: Date.now() }]
    }));
  };
  
  const addStoryChoices = () => {
    setConversationState(prev => ({ 
      ...prev,
      messages: [...prev.messages, { type: 'story_choices', content: '', timestamp: Date.now() }]
    }));
  };
  
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

  // Handle corner navigation clicks
  const handleCornerNavClick = (buttonId, action) => {
    console.log('Corner button clicked:', buttonId, action);
    
    setCornerNavState(prev => ({
      ...prev,
      activeButton: prev.activeButton === buttonId ? null : buttonId
    }));
    
    switch (action) {
      case 'goBack':
        if (currentPage === 'app') {
          setCurrentPage('marketing');
        } else if (appState.currentStep === 'dashboard' || 
                   appState.currentStep === 'conversation' || 
                   appState.currentStep === 'stats') {
          updateAppState({ currentStep: 'auth' });
        } else if (appState.currentStep === 'auth') {
          setCurrentPage('marketing');
        }
        break;
        
      case 'login':
        setCurrentPage('app');
        updateAppState({ currentStep: 'auth' });
        break;
        
      case 'viewStats':
        updateAppState({ currentStep: 'stats' });
        break;
        
      case 'watchDemo':
        console.log('Watch demo');
        break;
        
      case 'pricing':
        console.log('Show pricing');
        break;
        
      default:
        console.log('Unknown action:', action);
    }
  };

  // Function to start the app
  const startApp = () => {
    setCurrentPage('app');
    updateAppState({ currentStep: 'auth' });
  };
  
  // Handle starting a new story
  const startNewStory = () => {
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
  };
  
  // Handle user submit
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

    if (appState.currentStage === 'story_type_selection') {
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
  
  const handleStoryChoice = (choice) => {
    logger.userAction('story_choice_selected', { choice });
    addUserMessage(choice);
    handleStoryTypeSelection(choice);
    
    setConversationState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.type !== 'story_choices')
    }));
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
  
  // Enhancement functions
  const enhanceStory = async () => {
    logger.userAction('enhance_story_start', {
      originalLength: userContent.story.length,
      originalWordCount: userContent.story.split(' ').length,
      format: appState.selectedStyle,
      backendConnected: backendState.connected
    });

    updateEnhancementState({ isEnhancing: true, showMagicalLoading: true });
    
    await addSystemMessage("Perfect! Let me weave some magic into your story... ✨");
    
    setConversationState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.type !== 'loading')
    }));
    
    addMagicalLoading();
    
    let enhancedStory = generateEnhancedStory(userContent.story, appState.selectedStyle);
    
    // Wait for magical loading (3 seconds for demo)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setConversationState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.type !== 'magical_loading')
    }));
    
    updateEnhancementState({ 
      enhancementResult: {
        original: userContent.story,
        enhanced: enhancedStory,
        approved: false,
        isDemo: true
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
    
    addEnhancementResult(enhancedStory);
    
    queueMessages([
      { text: `✨ How does this enhanced version look, ${userContent.name || 'my friend'}? (Demo mode)`, delay: 1000 }
    ]);
  };
  
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
        { text: "🎉 Wonderful! Your enhanced story is ready!", delay: 800 },
        { text: "In the full version, you'd get even better AI enhancements and export options!", delay: 1000 },
        { text: "Thank you for using AuraMythos! ✨", delay: 800 }
      ]);
    } else {
      updateEnhancementState({ awaitingApproval: false });
      
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
    <>
      {/* CORNER NAVIGATION - Shows on all pages */}
      <CornerNavigation 
        onButtonClick={handleCornerNavClick}
        activeButton={cornerNavState.activeButton}
        isVisible={cornerNavState.showCornerNav}
        currentStep={currentPage === 'marketing' ? 'marketing' : appState.currentStep}
      />

      {/* MARKETING PAGE */}
      {currentPage === 'marketing' && (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          {/* Hero Section */}
          <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: isMobile ? '2.5rem' : '3.5rem',
              fontWeight: '700',
              color: '#2c3e50',
              margin: '0 0 20px 0',
              lineHeight: '1.2',
              maxWidth: '900px'
            }}>
              Creating stories should feel just like {' '}
              <span style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontStyle: 'italic'
              }}>
                Magic
              </span>
            </h1>

            <p style={{
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              color: '#64748b',
              margin: '0 0 40px 0',
              maxWidth: '600px'
            }}>
              Let your writing journey being with AuraMythos. Your personal writing assistant.
            </p>

            <div style={{
              display: 'flex',
              gap: '16px',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button 
                style={{
                  padding: '14px 28px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '24px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                onClick={startApp}
              >
                Start Writing Free
              </button>

              <button style={{
                padding: '14px 28px',
                background: 'transparent',
                border: '2px solid #e2e8f0',
                borderRadius: '24px',
                color: '#4a4a4a',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                See How It Works
              </button>
            </div>
          </div>

          {/* Features Section */}
          <div style={{
            padding: '80px 20px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0'
          }}>
            <div style={{
              maxWidth: '1000px',
              margin: '0 auto'
            }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '60px'
              }}>
                <h2 style={{
                  fontSize: isMobile ? '2rem' : '2.5rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 12px 0'
                }}>
                  Everything you need. Nothing you don't.
                </h2>
                <p style={{
                  fontSize: '1.1rem',
                  color: '#64748b',
                  margin: 0
                }}>
                  Simple, powerful features that transform your storytelling.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '32px'
              }}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: 'white',
                    fontSize: '24px'
                  }}>
                    🎤
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 8px 0'
                  }}>
                    Voice-First Design
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    Just speak naturally. Our AI transforms rambling thoughts into structured narratives instantly.
                  </p>
                </div>

                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: 'white',
                    fontSize: '24px'
                  }}>
                    📚
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 8px 0'
                  }}>
                    Any Format You Need
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    Books, comics, screenplays, games. One story, endless possibilities.
                  </p>
                </div>

                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: 'white',
                    fontSize: '24px'
                  }}>
                    ✨
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 8px 0'
                  }}>
                    AI-Powered Magic
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    Professional-quality enhancement that preserves your unique voice and style.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials Section */}
          <TestimonialsSection isMobile={isMobile} />
        </div>
      )}

      {/* APP PAGE */}
      {currentPage === 'app' && (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
          {/* AUTH SCREEN */}
          {appState.currentStep === 'auth' && (
            <div style={{
              minHeight: '100vh',
              padding: '40px 20px',
              paddingTop: '80px'
            }}>
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
                  Go from great idea to clear story. <em style={{ color: '#667eea' }}>Fast.</em>
                </p>
              </div>

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
                      createUserAccount(e.target.value.trim());
                      updateAppState({ currentStep: 'dashboard' });
                    }
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
                  onClick={(e) => {
                    const input = e.target.parentElement.querySelector('input');
                    if (input && input.value.trim()) {
                      createUserAccount(input.value.trim());
                      updateAppState({ currentStep: 'dashboard' });
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
                  Stories saved locally in your browser.
                </p>
              </div>
            </div>
          )}

          {/* DASHBOARD */}
          {appState.currentStep === 'dashboard' && (
            <div style={{
              minHeight: '100vh',
              width: '100%',
              background: '#f1f5f9',
              padding: '40px 20px',
              paddingTop: '80px',
              overflowY: 'auto'
            }}>
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
                      fontWeight: '600'
                    }}>
                      {userState.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h1 style={{
                        fontSize: '1.8rem',
                        fontWeight: '600',
                        color: '#1e293b',
                        margin: '0 0 4px 0'
                      }}>
                        Welcome back, {userState.user?.name}! 👋
                      </h1>
                      <p style={{ 
                        color: '#64748b', 
                        margin: 0,
                        fontSize: '16px',
                        fontStyle: 'italic'
                      }}>
                        Let's continue your storytelling journey.
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
                      fontSize: '14px'
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
              
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
                    fontStyle: 'italic'
                  }}>
                    Your Stories
                  </h2>
                  
                  <button
                    onClick={startNewStory}
                    style={{
                      padding: '12px 20px',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    + New Story
                  </button>
                </div>

                <div style={{
                  padding: '60px 20px',
                  background: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📚</div>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 8px 0'
                  }}>
                    Start Your First Story
                  </h3>
                  <p style={{
                    color: '#64748b',
                    margin: '0'
                  }}>
                    Click "New Story" to begin your creative journey
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STATS PAGE */}
          {appState.currentStep === 'stats' && (
            <div style={{
              minHeight: '100vh',
              width: '100%',
              background: '#f1f5f9',
              padding: '40px 20px',
              paddingTop: '80px',
              overflowY: 'auto'
            }}>
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
                  margin: '0 0 8px 0'
                }}>
                  Your Writing Journey
                </h1>
                
                <p style={{
                  fontSize: '1.1rem',
                  color: '#64748b',
                  margin: '0'
                }}>
                  Track your progress and celebrate your achievements
                </p>
              </div>

              <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '24px'
              }}>
                <div style={{
                  background: 'white',
                  padding: '40px 32px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '3.5rem', 
                    fontWeight: '800', 
                    color: '#667eea',
                    margin: '0 0 12px 0'
                  }}>
                    {userState.stories.length}
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 8px 0'
                  }}>
                    Stories Created
                  </h3>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '40px 32px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '3.5rem', 
                    fontWeight: '800', 
                    color: '#10b981',
                    margin: '0 0 12px 0'
                  }}>
                    0
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 8px 0'
                  }}>
                    Words Written
                  </h3>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '40px 32px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '3.5rem', 
                    fontWeight: '800', 
                    color: '#8b5cf6',
                    margin: '0 0 12px 0'
                  }}>
                    0
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 8px 0'
                  }}>
                    Enhanced Stories
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* CONVERSATION INTERFACE (Full Notebook) */}
          {appState.currentStep === 'conversation' && (
            <div style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              perspective: '1000px',
              overflow: 'hidden',
              position: 'relative'
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
                  
                  @keyframes floatSparkle {
                    0% { 
                      transform: translateY(0px) scale(0.8);
                      opacity: 0.3;
                    }
                    50% { 
                      transform: translateY(-15px) scale(1);
                      opacity: 1;
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
                  
                  .magical-text {
                    font-size: 18px;
                    font-weight: 600;
                    color: #667eea;
                    text-align: center;
                    animation: textGlow 2s ease-in-out infinite;
                    font-family: 'Special Elite', 'Courier New', monospace;
                  }
                  
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
                  }}
                >
                  {/* All messages */}
                  {conversationState.messages.map((message, index) => {
                    if (message.type === 'input') return null;
                    
                    // Handle magical loading animation
                    if (message.type === 'magical_loading') {
                      return (
                        <div key={index} style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '30px 20px',
                          margin: '16px 0',
                          background: 'transparent',
                          border: 'none',
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
                            background: 'transparent'
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0.8
                            }}>
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
                          
                          <div className="magical-text">
                            ✨ Weaving story magic... ✨
                          </div>
                        </div>
                      );
                    }

                    // Handle enhancement result with approval
                    if (message.type === 'enhancement_result') {
                      return (
                        <div key={index}>
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
                        style={{
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
                    <div style={{
                      marginBottom: '12px',
                      lineHeight: '1.8',
                      minHeight: '28.8px'
                    }}>
                      {conversationState.currentTyping}
                      {conversationState.showCursor && (
                        <span style={{
                          display: 'inline-block',
                          width: '2px',
                          height: '20px',
                          background: '#667eea',
                          marginLeft: '2px',
                          verticalAlign: 'text-bottom',
                          animation: 'blink 1s infinite'
                        }} />
                      )}
                    </div>
                  )}
                  
                  <div ref={refs.messagesEnd} />
                </div>

                {/* INPUT AREA */}
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
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleUserSubmit();
                        }
                      }}
                      placeholder={conversationState.messages.find(m => m.type === 'input')?.placeholder || "Type your response... (Enter to send)"}
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
            </div>
          )}
        </div>
      )}
    </>
  );
}