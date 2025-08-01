import React, { useState, useRef, useEffect, useCallback } from 'react';

// NextStepSelector Component
const NextStepSelector = ({ 
  onSelect, 
  onClose, 
  currentText = '',
  show = true 
}) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const options = [
    {
      id: 'format',
      title: 'Story Format',
      subtitle: 'Select story type (novel, comic, screenplay)',
      action: () => onSelect('format')
    },
    {
      id: 'enhance',
      title: 'Enhance',
      subtitle: 'Transform your story with artificial intelligence',
      action: () => onSelect('enhance')
    },
    {
      id: 'refine',
      title: 'Refine',
      subtitle: 'Make manual edits and improvements',
      action: () => onSelect('refine')
    }
  ];

  const handleOptionClick = (option) => {
    setSelectedOption(option.id);
    setTimeout(() => {
      option.action();
    }, 150);
  };

  if (!show) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.3)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
      opacity: show ? 1 : 0,
      transition: 'all 0.3s ease'
    },

    modal: {
      background: 'white',
      borderRadius: '24px',
      padding: '40px',
      maxWidth: '500px',
      width: '90%',
      textAlign: 'center',
      boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
      position: 'relative',
      transform: show ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
    },

    closeButton: {
      position: 'absolute',
      top: '16px',
      right: '20px',
      background: 'none',
      border: 'none',
      fontSize: '24px',
      color: '#64748b',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '50%',
      transition: 'all 0.2s ease'
    },

    header: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '12px',
      marginTop: '20px'
    },

    subtext: {
      fontSize: '16px',
      color: '#64748b',
      marginBottom: '32px',
      lineHeight: '1.5'
    },

    textPreview: {
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '24px',
      fontSize: '14px',
      color: '#475569',
      textAlign: 'left',
      maxHeight: '120px',
      overflow: 'hidden',
      position: 'relative'
    },

    textFade: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '20px',
      background: 'linear-gradient(transparent, #f8fafc)',
      pointerEvents: 'none'
    },

    optionsContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginBottom: '24px'
    },

    option: (isSelected) => ({
      padding: '20px',
      border: isSelected ? '2px solid #667eea' : '1px solid #e2e8f0',
      borderRadius: '16px',
      cursor: 'pointer',
      textAlign: 'left',
      background: isSelected ? '#f0f4ff' : 'white',
      transition: 'all 0.2s ease',
      transform: isSelected ? 'translateY(-2px)' : 'none',
      boxShadow: isSelected 
        ? '0 8px 25px rgba(102, 126, 234, 0.15)' 
        : '0 2px 8px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      alignItems: 'center'
    }),

    optionContent: {
      flex: 1,
      paddingLeft: '16px'
    },

    optionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      margin: '0 0 4px 0'
    },

    optionSubtitle: {
      fontSize: '14px',
      color: '#64748b',
      margin: 0
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>×</button>

        <h2 style={styles.header}>What's next?</h2>
        <p style={styles.subtext}>
          Choose how you'd like to continue with your story
        </p>

        {currentText && (
          <div style={styles.textPreview}>
            {currentText.substring(0, 200)}
            {currentText.length > 200 && '...'}
            {currentText.length > 150 && <div style={styles.textFade} />}
          </div>
        )}

        <div style={styles.optionsContainer}>
          {options.map((option) => (
            <div
              key={option.id}
              style={styles.option(selectedOption === option.id)}
              onClick={() => handleOptionClick(option)}
            >
              <div style={styles.optionContent}>
                <h3 style={styles.optionTitle}>{option.title}</h3>
                <p style={styles.optionSubtitle}>{option.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Enhanced Processing Modal Component
const ProcessingModal = ({ show, onClose }) => {
  const [processingStep, setProcessingStep] = useState(0);

  const processingSteps = [
    'analyzing',
    'enhancing', 
    'polishing'
  ];

  useEffect(() => {
    if (show) {
      setProcessingStep(0);
      
      const interval = setInterval(() => {
        setProcessingStep(prev => {
          if (prev < processingSteps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [show]);

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.3)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
      opacity: show ? 1 : 0,
      visibility: show ? 'visible' : 'hidden',
      transition: 'all 0.3s ease'
    },

    modal: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '24px',
      width: '90%',
      maxWidth: '400px',
      padding: '60px 40px',
      textAlign: 'center',
      boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
      transform: show ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      position: 'relative',
      color: 'white'
    },

    header: {
      fontSize: '20px',
      fontWeight: '500',
      color: 'white',
      marginBottom: '40px'
    },

    magicalLoader: {
      position: 'relative',
      width: '60px',
      height: '60px',
      margin: '0 auto 40px'
    },

    sparkle: (delay) => ({
      position: 'absolute',
      width: '8px',
      height: '8px',
      background: 'white',
      borderRadius: '50%',
      animation: `sparkle 2s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      opacity: 0
    }),

    cancelButton: {
      background: 'none',
      border: 'none',
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '16px',
      cursor: 'pointer',
      textDecoration: 'underline',
      marginTop: '20px',
      transition: 'color 0.2s ease'
    }
  };

  if (!show) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          ({processingStep + 1}/{processingSteps.length}) {processingSteps[processingStep]}...
        </div>

        <div style={styles.magicalLoader}>
          <div className="sparkle" style={styles.sparkle(0)} />
          <div className="sparkle" style={styles.sparkle(0.3)} />
          <div className="sparkle" style={styles.sparkle(0.6)} />
          <div className="sparkle" style={styles.sparkle(0.9)} />
          <div className="sparkle" style={styles.sparkle(1.2)} />
          <div className="sparkle" style={styles.sparkle(1.5)} />
        </div>

        <button style={styles.cancelButton} onClick={onClose}>
          cancel
        </button>
      </div>
    </div>
  );
};

// Enhanced Result Modal Component
const ResultModal = ({ show, result, onClose, onAction }) => {
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.3)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
      opacity: show ? 1 : 0,
      visibility: show ? 'visible' : 'hidden',
      transition: 'all 0.3s ease'
    },

    modal: {
      background: 'white',
      borderRadius: '24px',
      width: '90%',
      maxWidth: '700px',
      maxHeight: '90vh',
      overflow: 'hidden',
      boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
      transform: show ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      position: 'relative'
    },

    header: {
      padding: '32px 32px 0',
      textAlign: 'center',
      position: 'relative'
    },

    closeButton: {
      position: 'absolute',
      top: '16px',
      right: '24px',
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#64748b',
      padding: '8px',
      borderRadius: '50%',
      transition: 'all 0.2s ease'
    },

    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '12px',
      marginTop: '20px'
    },

    subtitle: {
      fontSize: '16px',
      color: '#64748b',
      marginBottom: '24px'
    },

    content: {
      padding: '0 32px 32px',
      maxHeight: 'calc(90vh - 200px)',
      overflowY: 'auto'
    },

    resultCard: {
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px'
    },

    resultHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },

    resultTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1e293b'
    },

    resultStats: {
      fontSize: '14px',
      color: '#64748b',
      display: 'flex',
      gap: '16px'
    },

    resultText: {
      fontSize: '15px',
      lineHeight: '1.6',
      color: '#374151',
      whiteSpace: 'pre-wrap',
      maxHeight: '300px',
      overflowY: 'auto',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      background: 'white'
    },

    actionButtons: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '12px',
      marginTop: '24px'
    },

    actionButton: (variant = 'primary') => ({
      padding: '12px 20px',
      border: variant === 'primary' ? 'none' : '2px solid #e2e8f0',
      borderRadius: '12px',
      background: variant === 'primary' ? 'linear-gradient(135deg, #667eea, #764ba2)' :
                  variant === 'danger' ? '#fee2e2' :
                  variant === 'success' ? '#ecfdf5' : 'white',
      color: variant === 'primary' ? 'white' :
             variant === 'danger' ? '#dc2626' :
             variant === 'success' ? '#16a34a' : '#64748b',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    }),

    navigation: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '24px',
      paddingTop: '24px',
      borderTop: '1px solid #e2e8f0'
    },

    navButton: (variant = 'secondary') => ({
      padding: '12px 24px',
      border: variant === 'primary' ? 'none' : '2px solid #e2e8f0',
      borderRadius: '12px',
      background: variant === 'primary' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'white',
      color: variant === 'primary' ? 'white' : '#64748b',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    })
  };

  if (!show || !result) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <button style={styles.closeButton} onClick={onClose}>×</button>
          <h2 style={styles.title}>✨ Your Story is Ready!</h2>
          <p style={styles.subtitle}>
            Here's your transformed masterpiece
          </p>
        </div>

        <div style={styles.content}>
          <div style={styles.resultCard}>
            <div style={styles.resultHeader}>
              <div style={styles.resultTitle}>Enhanced Story</div>
              <div style={styles.resultStats}>
                <span>📝 {result.wordCount || '150'} words</span>
                <span>⚡ AI Enhanced</span>
              </div>
            </div>

            <div style={styles.resultText}>
              {result.enhanced || result.original}
            </div>
          </div>

          <div style={styles.actionButtons}>
            <button 
              style={styles.actionButton('danger')} 
              onClick={() => onAction('delete')}
            >
              🗑️ Delete
            </button>
            <button 
              style={styles.actionButton('secondary')} 
              onClick={() => onAction('rewrite')}
            >
              ✏️ Rewrite
            </button>
            <button 
              style={styles.actionButton('success')}
              onClick={() => onAction('create-image')}
            >
              🎨 Create Image
            </button>
            <button 
              style={styles.actionButton('secondary')}
              onClick={() => onAction('share')}
            >
              📤 Share
            </button>
          </div>

          <div style={styles.navigation}>
            <button
              style={styles.navButton('secondary')}
              onClick={onClose}
            >
              Close
            </button>
            <button
              style={styles.navButton('primary')}
              onClick={() => onAction('create-another')}
            >
              Create Another →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// MinimalistNotebook Component
const MinimalistNotebook = ({ 
  onTextChange, 
  onComplete, 
  initialText = '',
  disabled = false 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentText, setCurrentText] = useState(initialText);
  const [statusMessage, setStatusMessage] = useState('');
  const [showStatus, setShowStatus] = useState(false);
  
  const recognitionRef = useRef(null);
  const statusTimeoutRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    const initialized = initSpeechRecognition();
    if (initialized) {
      showInitialMessage();
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  // Handle text changes
  useEffect(() => {
    if (onTextChange) {
      onTextChange(currentText);
    }
  }, [currentText, onTextChange]);

  const initSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      showStatusMessage('Speech recognition not supported. Try typing instead!', 'error');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      console.log('Speech recognition started');
      showStatusMessage('Listening... speak naturally', 'recording');
    };

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        }
      }
      
      if (finalTranscript.trim()) {
        setCurrentText(prev => {
          const newText = prev + finalTranscript;
          return newText;
        });
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      
      let message = 'Recording stopped';
      if (event.error === 'not-allowed') {
        message = 'Microphone access denied. Please allow microphone access and try again.';
      } else if (event.error === 'network') {
        message = 'Network error. Please check your connection.';
      } else if (event.error === 'no-speech') {
        message = 'No speech detected. Please try speaking again.';
      }
      
      showStatusMessage(message, 'error');
    };

    recognitionRef.current.onend = () => {
      console.log('Speech recognition ended');
      if (isRecording) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
          setIsRecording(false);
        }
      }
    };

    return true;
  };

  const showInitialMessage = () => {
    setTimeout(() => {
      showStatusMessage('Click the microphone to start speaking', 'info');
    }, 1000);
  };

  const showStatusMessage = (message, type = 'info') => {
    setStatusMessage(message);
    setShowStatus(true);
    
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
    
    statusTimeoutRef.current = setTimeout(() => {
      setShowStatus(false);
    }, 3000);
  };

  const toggleRecording = async () => {
    if (disabled) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    if (!recognitionRef.current) {
      const initialized = initSpeechRecognition();
      if (!initialized) {
        showStatusMessage('Speech recognition not available', 'error');
        return;
      }
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setIsRecording(true);
      showStatusMessage('Starting microphone...', 'info');
      
      setTimeout(() => {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Failed to start recognition:', error);
          setIsRecording(false);
          showStatusMessage('Failed to start recording. Please try again.', 'error');
        }
      }, 100);
      
    } catch (error) {
      console.error('Microphone access denied:', error);
      setIsRecording(false);
      showStatusMessage('Microphone access denied. Please allow microphone access.', 'error');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setIsRecording(false);
    
    if (currentText.trim()) {
      showStatusMessage('Recording stopped. You can continue speaking or move to the next step', 'success');
    } else {
      showStatusMessage('Click the microphone to start speaking', 'info');
    }
  };

  const clearText = () => {
    setCurrentText('');
    showStatusMessage('Text cleared. Ready for new input.', 'info');
  };

  const completeStory = () => {
    if (currentText.trim().length < 10) {
      showStatusMessage('Please add more content before continuing', 'error');
      return;
    }

    showStatusMessage('Story captured! Moving to next step...', 'success');

    if (isRecording) {
      stopRecording();
    }

    setTimeout(() => {
      if (onComplete) {
        onComplete(currentText.trim());
      }
    }, 500);
  };

  const handleManualInput = (e) => {
    setCurrentText(e.target.value);
  };

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
      fontFamily: "'Kalam', cursive",
      filter: disabled ? 'blur(2px)' : 'none',
      transition: 'filter 0.3s ease'
    },

    notebookContainer: {
      position: 'relative',
      transformStyle: 'preserve-3d',
      animation: 'gentleFloat 6s ease-in-out infinite'
    },

    notebookPaper: {
      width: '600px',
      height: '700px',
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
      bottom: '40px',
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

    textContent: {
      position: 'absolute',
      top: '100px',
      left: '100px',
      right: '60px',
      bottom: '60px',
      fontFamily: "'Kalam', cursive",
      fontSize: '18px',
      lineHeight: '28px',
      color: '#2c3e50'
    },

    textArea: {
      width: '100%',
      height: '100%',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      fontFamily: "'Kalam', cursive",
      fontSize: '18px',
      lineHeight: '28px',
      color: '#2c3e50',
      resize: 'none'
    },

    statusMessage: {
      position: 'absolute',
      top: '-100px',
      left: '50%',
      transform: showStatus ? 'translateX(-50%) translateY(-10px)' : 'translateX(-50%)',
      background: 'rgba(52, 152, 219, 0.9)',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '25px',
      fontSize: '16px',
      opacity: showStatus ? 1 : 0,
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)'
    },

    controls: {
      position: 'absolute',
      bottom: '-80px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '20px',
      alignItems: 'center'
    },

    controlBtn: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      opacity: disabled ? 0.5 : 1
    },

    recordBtn: {
      background: isRecording 
        ? 'linear-gradient(135deg, #95a5a6, #7f8c8d)' 
        : 'linear-gradient(135deg, #e74c3c, #c0392b)',
      color: 'white'
    },

    clearBtn: {
      background: 'linear-gradient(135deg, #95a5a6, #7f8c8d)',
      color: 'white'
    },

    doneBtn: {
      background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
      color: 'white',
      opacity: currentText.trim().length > 10 ? 1 : 0.5,
      pointerEvents: currentText.trim().length > 10 ? 'auto' : 'none',
      transform: currentText.trim().length > 10 ? 'scale(1)' : 'scale(0.95)',
      transition: 'all 0.3s ease'
    }
  };

  // Add CSS animations and button effects to head
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap');
      
      @keyframes gentleFloat {
        0%, 100% { 
          transform: translateY(0px) rotateX(2deg) rotateY(-1deg);
        }
        50% { 
          transform: translateY(-8px) rotateX(-1deg) rotateY(1deg);
        }
      }

      @keyframes sparkle {
        0%, 100% { 
          opacity: 0;
          transform: scale(0) rotate(0deg);
        }
        50% { 
          opacity: 1;
          transform: scale(1) rotate(180deg);
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

      .lets-begin-button:hover {
        background: rgba(255, 255, 255, 0.25) !important;
        border-color: rgba(255, 255, 255, 0.5) !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2) !important;
      }

      .lets-begin-button:active {
        transform: translateY(0px) !important;
      }
      
      .sparkle:nth-child(1) { top: 10px; left: 10px; }
      .sparkle:nth-child(2) { top: 5px; right: 15px; }
      .sparkle:nth-child(3) { bottom: 20px; left: 5px; }
      .sparkle:nth-child(4) { bottom: 10px; right: 10px; }
      .sparkle:nth-child(5) { top: 30px; left: 50%; }
      .sparkle:nth-child(6) { bottom: 40px; right: 30%; }

      .glass-button:hover {
        transform: scale(1.05) !important;
        box-shadow: 0 12px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2) !important;
      }

      .glass-button:active {
        transform: scale(0.98) !important;
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

      @media (max-width: 768px) {
        .notebook-paper {
          width: 90vw !important;
          height: 80vh !important;
          max-width: 450px !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
      <div style={styles.container}>
        <div style={styles.notebookContainer}>
          <div style={styles.notebookPaper}>
            <div style={styles.paperLines} />
            <div style={styles.paperMargin} />

            <div style={styles.statusMessage}>
              {statusMessage}
            </div>

            <div style={styles.textContent}>
              <textarea
                style={styles.textArea}
                value={currentText}
                onChange={handleManualInput}
                placeholder="Start speaking or type your story here..."
                disabled={disabled}
              />
            </div>

            <div style={styles.controls}>
              <button 
                className="glass-button"
                style={{...styles.controlBtn, ...styles.recordBtn}}
                onClick={toggleRecording}
                disabled={disabled}
                title={isRecording ? "Stop Recording" : "Start Recording"}
              >
                {isRecording ? <div className="stop-icon"></div> : <div className="play-icon"></div>}
              </button>
              
              <button 
                className="glass-button"
                style={{...styles.controlBtn, ...styles.clearBtn}}
                onClick={clearText}
                disabled={disabled}
                title="Clear Text"
              >
                🗑️
              </button>
              
              <button 
                className="glass-button"
                style={{...styles.controlBtn, ...styles.doneBtn}}
                onClick={completeStory}
                disabled={disabled || currentText.trim().length < 10}
                title="Continue to Next Step"
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
  const [currentStep, setCurrentStep] = useState('landing'); // Start with landing page
  const [text, setText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [showNextStepModal, setShowNextStepModal] = useState(false);
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Story formats
  const storyFormats = {
    story: {
      name: 'Novel',
      description: 'Rich narrative with detailed characters and scenes',
      icon: '📖'
    },
    comic: {
      name: 'Comic/Manga',
      description: 'Visual storytelling with panels and dialogue',
      icon: '💥'
    },
    screenplay: {
      name: 'Screenplay',
      description: 'Professional script format for film/video',
      icon: '🎬'
    },
    summary: {
      name: 'Blog Post',
      description: 'Engaging blog post or article format',
      icon: '📝'
    }
  };

  const handleLetsBegin = () => {
    setIsTransitioning(true);
    
    // Start the transition animation
    setTimeout(() => {
      setCurrentStep('notebook');
      setIsTransitioning(false);
    }, 1000); // 1 second transition
  };

  const handleNotebookComplete = (capturedText) => {
    console.log('Notebook completed with text:', capturedText);
    setText(capturedText);
    setCurrentStep('nextStep');
    setShowNextStepModal(true);
  };

  const handleNextStepSelect = (choice) => {
    setShowNextStepModal(false);
    
    switch(choice) {
      case 'format':
        setShowFormatSelector(true);
        break;
      case 'enhance':
        enhanceStory();
        break;
      case 'refine':
        setCurrentStep('refine');
        break;
    }
  };

  const enhanceStory = async () => {
    setShowProcessing(true);
    setCurrentStep('processing');
    
    // Simulate processing time (6 seconds for 3 steps at 2 seconds each)
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
          setShowProcessing(false);
          setShowResult(true);
          setCurrentStep('result');
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error('Processing error:', error);
        // Fallback demo result
        setResult({
          original: text,
          enhanced: `# Enhanced Story\n\n${text}\n\n[This is a demo enhancement. Connect your API for full AI magic!]`,
          wordCount: text.split(' ').length,
          demo: true
        });
        setShowProcessing(false);
        setShowResult(true);
        setCurrentStep('result');
      }
    }, 6000); // 6 seconds to show all processing steps
  };

  const handleFormatSelect = (format) => {
    setSelectedStyle(format);
    setShowFormatSelector(false);
    enhanceStory();
  };

  const handleResultAction = (action) => {
    console.log('Result action:', action);
    
    switch(action) {
      case 'delete':
        setResult(null);
        setShowResult(false);
        resetToNotebook();
        break;
      case 'rewrite':
        setShowResult(false);
        setCurrentStep('notebook');
        break;
      case 'create-image':
        alert('Image generation feature coming soon!');
        break;
      case 'share':
        alert('Share feature coming soon!');
        break;
      case 'create-another':
        resetToNotebook();
        break;
    }
  };

  const resetToNotebook = () => {
    setCurrentStep('landing'); // Reset to landing instead of notebook
    setText('');
    setSelectedStyle(null);
    setResult(null);
    setShowNextStepModal(false);
    setShowFormatSelector(false);
    setShowProcessing(false);
    setShowResult(false);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    },

    // Landing page styles
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
      transform: isTransitioning ? 'scale(1.1)' : 'scale(1)',
      transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
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
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      overflow: 'hidden'
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
    }),

    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.2)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(2px)'
    },

    modalContent: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      borderRadius: '24px',
      padding: '40px',
      maxWidth: '600px',
      width: '90%',
      textAlign: 'center',
      boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
      position: 'relative'
    },

    modalHeader: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '12px'
    },

    modalSubtext: {
      fontSize: '16px',
      color: '#64748b',
      marginBottom: '32px',
      lineHeight: '1.5'
    },

    formatGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px',
      marginBottom: '30px'
    },

    formatCard: (selected) => ({
      padding: '24px 20px',
      border: selected ? '2px solid #667eea' : '1px solid #e2e8f0',
      borderRadius: '16px',
      cursor: 'pointer',
      textAlign: 'center',
      background: selected ? '#f0f4ff' : 'white',
      transition: 'all 0.2s ease',
      transform: selected ? 'translateY(-2px)' : 'none',
      boxShadow: selected 
        ? '0 8px 25px rgba(102, 126, 234, 0.15)' 
        : '0 2px 8px rgba(0,0,0,0.05)'
    }),

    formatIcon: {
      fontSize: '32px',
      marginBottom: '12px',
      display: 'block'
    },

    formatName: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '8px'
    },

    formatDescription: {
      fontSize: '14px',
      color: '#64748b',
      lineHeight: '1.4'
    },

    closeButton: {
      position: 'absolute',
      top: '16px',
      right: '20px',
      background: 'transparent',
      border: 'none',
      fontSize: '24px',
      color: '#64748b',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '8px',
      transition: 'all 0.2s ease'
    }
  };

  return (
    <div style={styles.container}>
      {/* Landing Page */}
      {currentStep === 'landing' && (
        <div style={styles.landingContainer}>
          {/* Magical floating particles */}
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

      {/* Notebook Interface */}
      {(currentStep === 'notebook' || showNextStepModal || showFormatSelector || showProcessing || showResult) && (
        <MinimalistNotebook
          onComplete={handleNotebookComplete}
          onTextChange={(newText) => setText(newText)}
          initialText={text}
          disabled={showNextStepModal || showFormatSelector || showProcessing || showResult}
        />
      )}

      {/* Next Step Selector */}
      <NextStepSelector
        show={showNextStepModal}
        currentText={text}
        onSelect={handleNextStepSelect}
        onClose={() => setShowNextStepModal(false)}
      />

      {/* Format Selector Modal */}
      {showFormatSelector && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <button 
              style={styles.closeButton}
              onClick={() => setShowFormatSelector(false)}
            >
              ×
            </button>
            
            <h2 style={styles.modalHeader}>Choose Story Format</h2>
            <p style={styles.modalSubtext}>
              How would you like to format your story?
            </p>
            
            <div style={styles.formatGrid}>
              {Object.entries(storyFormats).map(([key, format]) => (
                <div
                  key={key}
                  onClick={() => handleFormatSelect(key)}
                  style={styles.formatCard(selectedStyle === key)}
                >
                  <span style={styles.formatIcon}>{format.icon}</span>
                  <h3 style={styles.formatName}>{format.name}</h3>
                  <p style={styles.formatDescription}>{format.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Processing Modal */}
      <ProcessingModal
        show={showProcessing}
        onClose={() => setShowProcessing(false)}
      />

      {/* Enhanced Result Modal */}
      <ResultModal
        show={showResult}
        result={result}
        onClose={() => setShowResult(false)}
        onAction={handleResultAction}
      />
    </div>
  );
}

export default App;