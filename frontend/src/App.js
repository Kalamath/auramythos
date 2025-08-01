import React, { useState, useRef, useEffect, useCallback } from 'react';

// Conversational Paper Interface - A True Dialogue with the Notebook
const ConversationalPaper = ({ 
  currentStep, 
  onStoryTypeSelect,
  onNotebookComplete,
  onNextStepSelect,
  onResultAction,
  selectedStyle,
  currentText,
  result
}) => {
  const [conversation, setConversation] = useState([]);
  const [currentLine, setCurrentLine] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userCanRespond, setUserCanRespond] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [awaitingResponse, setAwaitingResponse] = useState(false);
  const [responseOptions, setResponseOptions] = useState([]);

  // Speech recognition - Fixed to prevent duplication
  const [isRecording, setIsRecording] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState(''); // Track final transcript separately
  const recognitionRef = useRef(null);

  // Conversation scripts for each step
  const conversations = {
    storyType: [
      "Hello there! Welcome to your personal storytelling notebook.",
      "",
      "I'm here to help you transform your ideas into amazing stories.",
      "",
      "First, what type of story would you like to create today?",
      "",
      "📖 Book - A rich narrative with detailed characters",
      "💭 Comic - Visual storytelling with panels and dialogue", 
      "🎬 Screenplay - Scene-by-scene breakdown for film",
      "📝 Content - Engaging blog post or article",
      "",
      "Type your choice or click on any option above..."
    ],
    
    notebook: [
      `Perfect! Let's create your ${selectedStyle || 'story'}.`,
      "",
      "Tell me your story - you can speak or type. I'm listening...",
      "",
      "🎤 Click the microphone below to record your voice",
      "⌨️  Or simply start typing your story here",
      "",
      "Take your time. When you're ready, just say 'done' or type 'done'."
    ],

    nextStep: [
      "Wonderful! I can see your creative energy flowing.",
      "",
      "Here's what you've shared with me:",
      "---",
      `"${currentText?.substring(0, 200)}${currentText?.length > 200 ? '...' : ''}"`,
      "---",
      "",
      "Now, how would you like me to help you with this story?",
      "",
      "✨ Enhance - I'll use AI magic to transform and improve it",
      "✏️  Refine - You can make manual edits and improvements",
      "",
      "What would you prefer? Type 'enhance' or 'refine'..."
    ],

    processing: [
      "Excellent choice! Let me work my magic on your story...",
      "",
      "🔮 Analyzing your narrative structure...",
      "✨ Enhancing characters and dialogue...",
      "🎨 Polishing the final details...",
      "",
      "This won't take long - creating something beautiful for you!"
    ],

    result: [
      "✨ Ta-da! Your story has been transformed!",
      "",
      "Here's your enhanced masterpiece:",
      "═══════════════════════════════════════",
      result?.enhanced || result?.original || currentText || "",
      "═══════════════════════════════════════",
      "",
      `📊 ${result?.wordCount || currentText?.split(' ').length || 0} words of pure magic!`,
      "",
      "What would you like to do next?",
      "",
      "🗑️  Delete - Remove this story",
      "✏️  Rewrite - Try a different approach", 
      "🎨 Image - Create a visual representation",
      "📤 Share - Share your story with others",
      "🔄 Another - Create a completely new story",
      "",
      "Type any of the options above or click them..."
    ]
  };

  // Initialize conversation based on step
  useEffect(() => {
    if (conversations[currentStep]) {
      // Reset all state
      setConversation([]);
      setCurrentLine('');
      setUserCanRespond(false);
      setAwaitingResponse(false);
      setUserInput('');
      setIsTyping(false);
      
      // Extract response options from conversation
      const options = conversations[currentStep]
        .filter(line => line.includes('📖') || line.includes('💭') || line.includes('🎬') || line.includes('📝') || 
                       line.includes('✨') || line.includes('✏️') || line.includes('🗑️') || line.includes('🎨') || 
                       line.includes('📤') || line.includes('🔄'))
        .map(line => {
          if (line.includes('📖')) return { key: 'story', text: 'book', line };
          if (line.includes('💭')) return { key: 'comic', text: 'comic', line };
          if (line.includes('🎬')) return { key: 'screenplay', text: 'screenplay', line };
          if (line.includes('📝')) return { key: 'summary', text: 'content', line };
          if (line.includes('✨') && currentStep === 'nextStep') return { key: 'enhance', text: 'enhance', line };
          if (line.includes('✏️') && currentStep === 'nextStep') return { key: 'refine', text: 'refine', line };
          if (line.includes('🗑️')) return { key: 'delete', text: 'delete', line };
          if (line.includes('✏️') && currentStep === 'result') return { key: 'rewrite', text: 'rewrite', line };
          if (line.includes('🎨')) return { key: 'create-image', text: 'image', line };
          if (line.includes('📤')) return { key: 'share', text: 'share', line };
          if (line.includes('🔄')) return { key: 'create-another', text: 'another', line };
          return null;
        })
        .filter(Boolean);
      
      setResponseOptions(options);
      
      // Start typing the conversation with a delay to ensure clean state
      setTimeout(() => {
        typeConversation(conversations[currentStep]);
      }, 100);
    }
  }, [currentStep, selectedStyle, currentText, result]);

  const typeConversation = async (lines) => {
    setIsTyping(true);
    setConversation([]); // Start with empty conversation
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line === "") {
        // Add empty line immediately to conversation
        setConversation(prev => [...prev, ""]);
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        // Clear current line before typing
        setCurrentLine('');
        
        // Type out character by character in currentLine
        for (let j = 0; j <= line.length; j++) {
          setCurrentLine(line.slice(0, j));
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Once typing is complete, move line to conversation and clear currentLine
        setConversation(prev => [...prev, line]);
        setCurrentLine('');
        
        // Pause between lines
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // All typing complete
    setIsTyping(false);
    setCurrentLine('');
    
    // Enable user response for interactive steps
    if (['storyType', 'nextStep', 'result'].includes(currentStep)) {
      setUserCanRespond(true);
      setAwaitingResponse(true);
    }
  };

  // Handle user text input
  const handleUserInput = (e) => {
    setUserInput(e.target.value);
  };

  // Handle user submission
  const handleUserSubmit = (value = null) => {
    const input = (value || userInput).toLowerCase().trim();
    
    if (!input) return;
    
    // Add user's response to conversation
    setConversation(prev => [...prev, "", `> ${value || userInput}`]);
    setUserInput('');
    setUserCanRespond(false);
    setAwaitingResponse(false);
    
    // Process the response based on current step
    setTimeout(() => {
      processUserResponse(input);
    }, 500);
  };

  const processUserResponse = (input) => {
    switch (currentStep) {
      case 'storyType':
        let selectedType = null;
        if (input.includes('book') || input.includes('story') || input.includes('novel')) {
          selectedType = 'story';
        } else if (input.includes('comic') || input.includes('manga')) {
          selectedType = 'comic';
        } else if (input.includes('screenplay') || input.includes('script') || input.includes('film')) {
          selectedType = 'screenplay';
        } else if (input.includes('content') || input.includes('blog') || input.includes('article')) {
          selectedType = 'summary';
        }
        
        if (selectedType && onStoryTypeSelect) {
          onStoryTypeSelect(selectedType);
        }
        break;
        
      case 'nextStep':
        if (input.includes('enhance')) {
          if (onNextStepSelect) onNextStepSelect('enhance');
        } else if (input.includes('refine')) {
          if (onNextStepSelect) onNextStepSelect('refine');
        }
        break;
        
      case 'result':
        if (input.includes('delete')) {
          if (onResultAction) onResultAction('delete');
        } else if (input.includes('rewrite')) {
          if (onResultAction) onResultAction('rewrite');
        } else if (input.includes('image')) {
          if (onResultAction) onResultAction('create-image');
        } else if (input.includes('share')) {
          if (onResultAction) onResultAction('share');
        } else if (input.includes('another')) {
          if (onResultAction) onResultAction('create-another');
        }
        break;
    }
  };

  // Handle option clicks
  const handleOptionClick = (option) => {
    handleUserSubmit(option.text);
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && userCanRespond) {
      e.preventDefault();
      handleUserSubmit();
    }
  };

  // FIXED: Speech recognition for notebook step - prevents duplication
  useEffect(() => {
    if (currentStep === 'notebook') {
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

    // FIXED: Prevent text duplication by tracking processed results
    let lastProcessedIndex = 0;

    recognitionRef.current.onresult = (event) => {
      let newFinalTranscript = '';
      
      // Only process new results to prevent duplication
      for (let i = lastProcessedIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinalTranscript += transcript + ' ';
        }
      }
      
      // Update the last processed index
      lastProcessedIndex = event.results.length;
      
      if (newFinalTranscript.trim()) {
        setFinalTranscript(prev => prev + newFinalTranscript);
        setUserInput(prev => prev + newFinalTranscript);
      }
    };

    recognitionRef.current.onstart = () => {
      // Reset tracking when starting new recognition
      lastProcessedIndex = 0;
      setFinalTranscript('');
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
    if (currentStep !== 'notebook') return;
    
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

  const handleNotebookSubmit = () => {
    if (userInput.trim().length < 10) return;
    
    if (onNotebookComplete) {
      onNotebookComplete(userInput.trim());
    }
  };

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 600);
    
    return () => clearInterval(interval);
  }, []);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      perspective: '1000px',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: "'Kalam', cursive"
    },

    notebookContainer: {
      position: 'relative',
      transformStyle: 'preserve-3d',
      animation: 'gentleFloat 6s ease-in-out infinite'
    },

    notebookPaper: {
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
    },

    paperLines: {
      position: 'absolute',
      top: '80px',
      left: 0,
      right: 0,
      bottom: currentStep === 'notebook' ? '120px' : '40px',
      backgroundImage: `repeating-linear-gradient(
        transparent,
        transparent 27px,
        #e8f4fd 27px,
        #e8f4fd 28px
      )`,
      pointerEvents: 'none'
    },

    paperMargin: {
      position: 'absolute',
      left: '80px',
      top: 0,
      width: '2px',
      height: '100%',
      background: '#ffb3ba',
      opacity: 0.6,
      pointerEvents: 'none'
    },

    content: {
      position: 'absolute',
      top: '100px',
      left: '100px',
      right: '60px',
      bottom: currentStep === 'notebook' ? '140px' : '60px',
      fontFamily: "'Special Elite', 'Courier New', monospace",
      fontSize: '16px',
      lineHeight: '28px',
      color: '#2c3e50',
      overflowY: 'auto'
    },

    conversationLine: {
      marginBottom: '0px',
      lineHeight: '28px'
    },

    currentLine: {
      marginBottom: '0px',
      lineHeight: '28px'
    },

    cursor: {
      display: (isTyping && showCursor) ? 'inline-block' : 'none',
      width: '2px',
      height: '20px',
      background: '#667eea',
      marginLeft: '2px',
      animation: 'blink 1s infinite'
    },

    userInputArea: {
      display: userCanRespond ? 'block' : 'none',
      marginTop: '28px',
      borderTop: '1px solid #e2e8f0',
      paddingTop: '14px'
    },

    userInput: {
      width: '100%',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      fontFamily: "'Special Elite', 'Courier New', monospace",
      fontSize: '16px',
      lineHeight: '28px',
      color: '#2c3e50',
      resize: 'none',
      minHeight: currentStep === 'notebook' ? '200px' : '28px'
    },

    notebookInputArea: {
      display: currentStep === 'notebook' ? 'block' : 'none',
      position: 'absolute',
      bottom: '140px',
      left: '100px',
      right: '60px'
    },

    notebookInput: {
      width: '100%',
      height: '200px',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      fontFamily: "'Special Elite', 'Courier New', monospace",
      fontSize: '16px',
      lineHeight: '28px',
      color: '#2c3e50',
      resize: 'none'
    },

    controls: {
      position: 'absolute',
      bottom: '-80px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: currentStep === 'notebook' ? 'flex' : 'none',
      gap: '20px',
      alignItems: 'center'
    },

    controlBtn: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    },

    recordBtn: {
      background: isRecording 
        ? 'linear-gradient(135deg, #95a5a6, #7f8c8d)' 
        : 'linear-gradient(135deg, #e74c3c, #c0392b)',
      color: 'white'
    },

    doneBtn: {
      background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
      color: 'white',
      opacity: userInput.trim().length > 10 ? 1 : 0.5,
      pointerEvents: userInput.trim().length > 10 ? 'auto' : 'none'
    },

    clickableOption: {
      cursor: 'pointer',
      transition: 'color 0.2s ease',
      ':hover': {
        color: '#667eea'
      }
    }
  };

  return (
    <div style={styles.container}>
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

          .clickable-option:hover {
            color: #667eea !important;
            cursor: pointer !important;
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

          .checkmark-icon {
            position: relative;
            width: 18px;
            height: 18px;
          }

          .checkmark-icon::after {
            content: '';
            position: absolute;
            left: 6px;
            top: 3px;
            width: 6px;
            height: 10px;
            border: solid currentColor;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
          }
        `}
      </style>
      <div style={styles.notebookContainer}>
        <div style={styles.notebookPaper}>
          <div style={styles.paperLines} />
          <div style={styles.paperMargin} />

          <div style={styles.content}>
            {/* Render completed conversation lines */}
            {conversation.map((line, index) => (
              <div key={index} style={styles.conversationLine}>
                {responseOptions.some(opt => opt.line === line) ? (
                  <span 
                    className="clickable-option"
                    onClick={() => handleOptionClick(responseOptions.find(opt => opt.line === line))}
                  >
                    {line}
                  </span>
                ) : (
                  line
                )}
              </div>
            ))}
            
            {/* Current typing line - only show when actively typing */}
            {isTyping && currentLine && (
              <div style={styles.currentLine}>
                {currentLine}
                <span style={styles.cursor}></span>
              </div>
            )}

            {/* User input area for interactive steps */}
            <div style={styles.userInputArea}>
              <textarea
                style={styles.userInput}
                value={userInput}
                onChange={handleUserInput}
                onKeyPress={handleKeyPress}
                placeholder={awaitingResponse ? "Type your response..." : ""}
                disabled={!userCanRespond}
              />
            </div>
          </div>

          {/* Dedicated notebook input area */}
          <div style={styles.notebookInputArea}>
            <textarea
              style={styles.notebookInput}
              value={userInput}
              onChange={handleUserInput}
              placeholder={`Tell me your ${selectedStyle || 'story'}... speak or type`}
            />
          </div>

          {/* Controls for notebook step */}
          <div style={styles.controls}>
            <button 
              style={{...styles.controlBtn, ...styles.recordBtn}}
              onClick={toggleRecording}
              title={isRecording ? "Stop Recording" : "Start Recording"}
            >
              {isRecording ? <div className="stop-icon"></div> : <div className="play-icon"></div>}
            </button>
            
            <button 
              style={{...styles.controlBtn, ...styles.doneBtn}}
              onClick={handleNotebookSubmit}
              title="Complete Story"
            >
              <div className="checkmark-icon"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [currentStep, setCurrentStep] = useState('landing');
  const [text, setText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [result, setResult] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleLetsBegin = () => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentStep('storyType');
      setIsTransitioning(false);
    }, 1200);
  };

  const handleStoryTypeSelect = (format) => {
    setSelectedStyle(format);
    setCurrentStep('notebook');
  };

  const handleNotebookComplete = (completedText) => {
    setText(completedText);
    setCurrentStep('nextStep');
  };

  const handleNextStepSelect = (choice) => {
    switch(choice) {
      case 'enhance':
        enhanceStory();
        break;
      case 'refine':
        setCurrentStep('notebook');
        break;
      default:
        break;
    }
  };

  const enhanceStory = async () => {
    setCurrentStep('processing');
    
    setTimeout(async () => {
      try {
        const response = await fetch('http://localhost:5001/api/enhance-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text,
            format: selectedStyle || 'story',
            generateVisuals: false
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setResult(data);
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error('Processing error:', error);
        // Fallback demo result
        setResult({
          original: text,
          enhanced: `Enhanced ${selectedStyle || 'Story'}:\n\n${text}\n\n[This is a demo enhancement. Your API integration will make this even more magical!]`,
          wordCount: text.split(' ').length,
          demo: true
        });
      }
      
      setCurrentStep('result');
    }, 4000);
  };

  const handleResultAction = (action) => {
    switch(action) {
      case 'delete':
        setResult(null);
        resetToNotebook();
        break;
      case 'rewrite':
        setCurrentStep('notebook');
        break;
      case 'create-image':
        // Add image generation logic here
        console.log('Creating image...');
        break;
      case 'share':
        // Add sharing logic here
        console.log('Sharing story...');
        break;
      case 'create-another':
        resetToNotebook();
        break;
    }
  };

  const resetToNotebook = () => {
    setCurrentStep('landing');
    setText('');
    setSelectedStyle(null);
    setResult(null);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    },

    landingContainer: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4c5aa7 0%, #5a4a7a 100%)',
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
      transition: 'all 1.2s cubic-bezier(0.23, 1, 0.32, 1)'
    },

    landingTitle: {
      fontSize: '4.5rem',
      fontWeight: '800',
      marginBottom: '24px',
      background: 'linear-gradient(45deg, #ffffff, #e0e7ff)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 4px 20px rgba(0,0,0,0.3)'
    },

    landingTagline: {
      fontSize: '1.2rem',
      fontWeight: '300',
      marginBottom: '48px',
      color: 'rgba(255, 255, 255, 0.9)',
      maxWidth: '600px',
      lineHeight: '1.6'
    },

    letsBeginButton: {
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
      transform: 'translateY(0)',
    },

    magicalParticles: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      pointerEvents: 'none'
    },

    particle: (delay, size, left, duration) => ({
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      background: 'rgba(255, 255, 255, 0.6)',
      borderRadius: '50%',
      left: `${left}%`,
      bottom: '-10px',
      animation: `floatUp ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      opacity: 0
    })
  };

  return (
    <div style={styles.container}>
      {/* Landing Page */}
      {currentStep === 'landing' && (
        <div style={styles.landingContainer}>
          <style>
            {`
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

              .lets-begin-button:hover {
                transform: translateY(-2px) !important;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
                background: rgba(255, 255, 255, 0.25) !important;
              }
            `}
          </style>
          
          <div style={styles.magicalParticles}>
            <div style={styles.particle(0, 6, 10, 8)} />
            <div style={styles.particle(1, 4, 20, 12)} />
            <div style={styles.particle(2, 8, 30, 10)} />
            <div style={styles.particle(3, 5, 50, 15)} />
            <div style={styles.particle(4, 7, 70, 9)} />
            <div style={styles.particle(5, 4, 80, 13)} />
            <div style={styles.particle(6, 6, 90, 11)} />
          </div>

          <h1 style={styles.landingTitle}>AuraMythos.ai</h1>
          <h5 style={styles.landingTagline}>
            Turn your ideas into fully realized stories, just like magic. <strong>Simply speak it, and watch AuraMythos give it life.</strong>
          </h5>
          
          <button 
            className="lets-begin-button"
            style={styles.letsBeginButton}
            onClick={handleLetsBegin}
          >
            Let's Begin
          </button>
        </div>
      )}

      {/* Conversational Paper Interface for all other steps */}
      {currentStep !== 'landing' && (
        <ConversationalPaper
          currentStep={currentStep}
          onStoryTypeSelect={handleStoryTypeSelect}
          onNotebookComplete={handleNotebookComplete}
          onNextStepSelect={handleNextStepSelect}
          onResultAction={handleResultAction}
          selectedStyle={selectedStyle}
          currentText={text}
          result={result}
        />
      )}
    </div>
  );
}

export default App;