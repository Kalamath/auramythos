import React, { useState, useRef, useEffect, useCallback } from 'react';

// Enhanced Error Recovery System
class AuraMythosErrorRecovery {
  constructor() {
    this.recoveryStrategies = new Map();
    this.initializeRecoveryStrategies();
  }

  initializeRecoveryStrategies() {
    this.recoveryStrategies.set('microphone_denied', {
      action: 'show_permission_help',
      fallback: 'text_input_mode'
    });

    this.recoveryStrategies.set('speech_recognition_failed', {
      action: 'retry_with_guidance',
      fallback: 'text_input_mode'
    });

    this.recoveryStrategies.set('processing_failed', {
      action: 'show_demo_result',
      fallback: 'demo_mode'
    });
  }

  async handleError(errorType, errorData = {}) {
    const strategy = this.recoveryStrategies.get(errorType);
    if (!strategy) return { action: 'unknown_error', data: { message: 'Something went wrong. Please try again.' } };

    return {
      action: strategy.action,
      fallback: strategy.fallback,
      data: this.getErrorData(errorType, errorData)
    };
  }

  getErrorData(errorType, errorData) {
    const errorMessages = {
      microphone_denied: {
        title: '🎤 Microphone Access Needed',
        message: 'Please allow microphone access to record your voice.',
        action: 'Grant Permission'
      },
      speech_recognition_failed: {
        title: '🔄 Let\'s Try Again',
        message: 'Having trouble hearing you clearly. Try speaking closer to your microphone.',
        action: 'Retry Recording'
      },
      processing_failed: {
        title: '✨ Demo Mode',
        message: 'Showing you a preview of what AuraMythos can do!',
        action: 'See Demo'
      }
    };

    return errorMessages[errorType] || { message: 'Something went wrong.' };
  }
}

// Format options with better names for user selection
const storyFormats = {
  story: {
    icon: '📖',
    name: 'Novel',
    description: 'Rich narrative with detailed characters and scenes'
  },
  comic: {
    icon: '💭',
    name: 'Comic/Manga',
    description: 'Visual storytelling with panels and dialogue'
  },
  screenplay: {
    icon: '🎬',
    name: 'Storyboard',
    description: 'Scene-by-scene visual breakdown for film/video'
  },
  summary: {
    icon: '📝',
    name: 'Blog',
    description: 'Engaging blog post or article format'
  }
};

// Voice Visualizer Component
const VoiceVisualizer = ({ isRecording, audioLevel = 0 }) => {
  const [bars, setBars] = useState(Array(12).fill(0));

  useEffect(() => {
    if (!isRecording) {
      setBars(Array(12).fill(0));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * (0.3 + audioLevel * 0.7)));
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording, audioLevel]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      height: '60px',
      margin: '20px 0'
    }}>
      {bars.map((height, index) => (
        <div
          key={index}
          style={{
            width: '6px',
            height: `${Math.max(8, height * 50)}px`,
            background: isRecording 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : '#e2e8f0',
            borderRadius: '3px',
            transition: 'all 0.1s ease',
            opacity: isRecording ? 0.7 + height * 0.3 : 0.3
          }}
        />
      ))}
    </div>
  );
};

// Clean styles
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 20px 100px 20px',
    position: 'relative'
  },

  header: {
    textAlign: 'center',
    marginBottom: '60px',
    maxWidth: '600px'
  },

  logo: {
    fontSize: '3rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '16px'
  },

  tagline: {
    fontSize: '1.4rem',
    color: '#64748b',
    marginBottom: '12px',
    fontWeight: '500'
  },

  description: {
    fontSize: '1.1rem',
    color: '#94a3b8',
    lineHeight: '1.6',
    maxWidth: '500px',
    margin: '0 auto'
  },

  mainCard: {
    background: 'white',
    borderRadius: '32px',
    padding: '60px 50px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.08)',
    border: '1px solid #f1f5f9',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    position: 'relative'
  },

  backButton: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    background: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#64748b',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },

  recordingPrompt: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '12px'
  },

  recordingInstructions: {
    fontSize: '1.1rem',
    color: '#64748b',
    lineHeight: '1.6',
    marginBottom: '40px',
    maxWidth: '400px',
    margin: '0 auto 40px'
  },

  recordButton: (disabled) => ({
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    border: 'none',
    background: disabled 
      ? '#e2e8f0' 
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontSize: '3rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: disabled 
      ? 'none' 
      : '0 12px 40px rgba(102, 126, 234, 0.3)',
    transform: disabled ? 'none' : 'scale(1)',
    margin: '0 auto',
    display: 'block'
  }),

  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(8px)'
  },

  modalContent: {
    background: 'white',
    borderRadius: '32px',
    padding: '50px 40px',
    maxWidth: '500px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
    position: 'relative'
  },

  modalBackButton: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    background: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#64748b',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },

  formatSelectorContent: {
    background: 'white',
    borderRadius: '32px',
    padding: '50px 40px',
    maxWidth: '600px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
    position: 'relative'
  },

  formatSelectorHeader: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '12px'
  },

  formatSelectorSubtext: {
    fontSize: '1.1rem',
    color: '#64748b',
    marginBottom: '40px',
    lineHeight: '1.5'
  },

  formatGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },

  formatCard: (selected) => ({
    padding: '30px 20px',
    border: selected ? '3px solid #667eea' : '2px solid #e2e8f0',
    borderRadius: '20px',
    cursor: 'pointer',
    textAlign: 'center',
    background: selected 
      ? 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)' 
      : 'white',
    transition: 'all 0.3s ease',
    transform: selected ? 'translateY(-4px)' : 'none',
    boxShadow: selected 
      ? '0 12px 24px rgba(102, 126, 234, 0.2)' 
      : '0 4px 12px rgba(0,0,0,0.05)'
  }),

  formatIcon: {
    fontSize: '3rem',
    marginBottom: '16px',
    display: 'block'
  },

  formatName: {
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px'
  },

  formatDescription: {
    fontSize: '1rem',
    color: '#64748b',
    lineHeight: '1.5'
  },

  formatSelectButton: (disabled) => ({
    width: '100%',
    padding: '18px 36px',
    background: disabled 
      ? '#e2e8f0' 
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: disabled 
      ? 'none' 
      : '0 8px 24px rgba(102, 126, 234, 0.3)',
    marginTop: '10px'
  }),

  recordingHeader: {
    fontSize: '1.8rem',
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: '12px'
  },

  recordingSubtext: {
    fontSize: '1.1rem',
    color: '#64748b',
    marginBottom: '30px',
    lineHeight: '1.5'
  },

  stopButton: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    fontSize: '2rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4)',
    margin: '20px auto',
    display: 'block'
  },

  processingHeader: {
    fontSize: '1.8rem',
    fontWeight: '600',
    color: '#667eea',
    marginBottom: '16px'
  },

  processingSubtext: {
    fontSize: '1.1rem',
    color: '#64748b',
    marginBottom: '40px',
    lineHeight: '1.5'
  },

  processingSpinner: {
    width: '80px',
    height: '80px',
    border: '6px solid #f1f5f9',
    borderTop: '6px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 30px'
  },

  processingSteps: {
    textAlign: 'left',
    maxWidth: '300px',
    margin: '0 auto'
  },

  processingStep: (isActive, isComplete) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    fontSize: '14px',
    color: isComplete ? '#16a34a' : isActive ? '#667eea' : '#94a3b8',
    fontWeight: isActive ? '600' : '400'
  }),

  stepIcon: (isActive, isComplete) => ({
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: isComplete ? '#16a34a' : isActive ? '#667eea' : '#e2e8f0',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600'
  }),

  textEditHeader: {
    fontSize: '1.4rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px',
    textAlign: 'center'
  },

  textEditSubtext: {
    fontSize: '1rem',
    color: '#64748b',
    marginBottom: '24px',
    textAlign: 'center'
  },

  textArea: {
    width: '100%',
    minHeight: '200px',
    padding: '20px',
    border: '2px solid #f1f5f9',
    borderRadius: '16px',
    fontSize: '16px',
    lineHeight: '1.6',
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit',
    background: '#fafbfc',
    color: '#1e293b',
    transition: 'all 0.3s ease',
    marginBottom: '20px',
    boxSizing: 'border-box'
  },

  formatDetection: {
    padding: '12px 16px',
    background: '#f0f4ff',
    border: '1px solid #e0e7ff',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#4338ca'
  },

  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginTop: '24px'
  },

  actionButton: (variant = 'primary') => ({
    padding: '14px 28px',
    background: variant === 'primary' 
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : variant === 'danger'
        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
        : 'transparent',
    color: variant === 'primary' || variant === 'danger' ? 'white' : '#64748b',
    border: variant === 'primary' || variant === 'danger' ? 'none' : '1px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  }),

  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(241, 245, 249, 0.8)',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'center',
    zIndex: 50
  },

  footerContent: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center'
  },

  footerButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: '500'
  },

  footerButtonIcon: {
    fontSize: '20px',
    marginBottom: '2px'
  },

  resultsSection: {
    marginTop: '40px',
    maxWidth: '800px',
    width: '100%'
  },

  resultsCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9'
  },

  resultsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f1f5f9'
  },

  resultsTitle: {
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#1e293b'
  },

  resultsStats: {
    fontSize: '14px',
    color: '#64748b',
    display: 'flex',
    gap: '16px'
  },

  comparisonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '24px'
  },

  comparisonSection: (isEnhanced) => ({
    padding: '20px',
    border: '1px solid #f1f5f9',
    borderRadius: '12px',
    background: isEnhanced ? '#f8fafc' : '#fafbfc'
  }),

  comparisonTitle: (isEnhanced) => ({
    fontSize: '14px',
    fontWeight: '600',
    color: isEnhanced ? '#667eea' : '#64748b',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }),

  comparisonText: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#374151',
    whiteSpace: 'pre-wrap'
  },

  statusMessage: (type) => ({
    padding: '16px 20px',
    margin: '20px 0',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '500',
    background: 
      type === 'error' ? '#fef2f2' : 
      type === 'warning' ? '#fffbeb' : 
      type === 'success' ? '#f0fdf4' : 
      '#eff6ff',
    color: 
      type === 'error' ? '#dc2626' : 
      type === 'warning' ? '#d97706' : 
      type === 'success' ? '#16a34a' : 
      '#2563eb',
    border: `1px solid ${
      type === 'error' ? '#fecaca' : 
      type === 'warning' ? '#fed7aa' : 
      type === 'success' ? '#bbf7d0' : 
      '#bfdbfe'
    }`,
    textAlign: 'center'
  }),

  loadingSpinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginRight: '8px'
  }
};

// Main App Component
function App() {
  const [text, setText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [showFormatSelector, setShowFormatSelector] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [recordingModalStep, setRecordingModalStep] = useState('recording');
  const [processingStep, setProcessingStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  
  const recognitionRef = useRef(null);
  const [errorRecovery] = useState(() => new AuraMythosErrorRecovery());

  const bottomNavButtons = [
    { id: 'user', icon: '👤', label: 'Profile' },
    { id: 'upload', icon: '📁', label: 'Upload' },
    { id: 'write', icon: '✏️', label: 'Write' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  const selectFormat = (formatKey) => {
    setSelectedStyle(formatKey);
    setShowFormatSelector(false);
  };

  const handleFormatCardClick = (formatKey) => {
    setSelectedStyle(formatKey);
    // Immediately close the modal and go to recording page
    setShowFormatSelector(false);
  };

  const goBackToFormatSelection = () => {
    setShowFormatSelector(true);
    setSelectedStyle('');
    setText('');
    setResult(null);
    setStatus(null);
  };

  const detectFormatFromText = useCallback((text) => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('comic') || lowerText.includes('panel') || lowerText.includes('superhero')) {
      return 'comic';
    } else if (lowerText.includes('screenplay') || lowerText.includes('script') || lowerText.includes('scene') || lowerText.includes('fade in')) {
      return 'screenplay';
    } else if (lowerText.includes('blog') || lowerText.includes('article') || lowerText.includes('post')) {
      return 'summary';
    } else {
      return selectedStyle;
    }
  }, [selectedStyle]);

  useEffect(() => {
    initializeSpeechRecognition();
  }, []);

  useEffect(() => {
    if (text.length > 50 && selectedStyle) {
      const detectedFormat = detectFormatFromText(text);
      if (detectedFormat !== selectedStyle) {
        const lowerText = text.toLowerCase();
        const strongIndicators = ['comic book', 'manga style', 'storyboard for', 'blog post about'];
        const hasStrongIndicator = strongIndicators.some(indicator => lowerText.includes(indicator));
        
        if (hasStrongIndicator) {
          setSelectedStyle(detectedFormat);
        }
      }
    }
  }, [text, detectFormatFromText, selectedStyle]);

  const initializeSpeechRecognition = async () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setStatus({ type: 'warning', message: 'Speech recognition not supported. Please use the write button instead.' });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    
    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setText(prev => {
          const newText = prev + finalTranscript;
          console.log('Updated text:', newText); // Debug log
          return newText;
        });
      }
    };
    
    recognitionRef.current.onerror = async (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setShowRecordingModal(false);
      setRecordingModalStep('recording');
      
      const recovery = await errorRecovery.handleError(
        event.error === 'not-allowed' ? 'microphone_denied' : 'speech_recognition_failed'
      );
      
      if (recovery.action === 'show_permission_help') {
        setModalContent(recovery.data);
        setShowModal(true);
      } else {
        setStatus({ type: 'error', message: recovery.data.message });
      }
    };
    
    recognitionRef.current.onend = () => {
      setIsRecording(false);
      // Always show editing step - let user see even if no text was captured
      setRecordingModalStep('editing');
    };
  };

  const startRecording = async () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setStatus({ type: 'error', message: 'Speech recognition not supported. Please use the write button instead.' });
      return;
    }

    if (!recognitionRef.current) {
      await initializeSpeechRecognition();
    }
    
    try {
      setShowRecordingModal(true);
      setRecordingModalStep('recording');
      setIsRecording(true);
      setText('');
      recognitionRef.current.start();
    } catch (error) {
      setIsRecording(false);
      setShowRecordingModal(false);
      setRecordingModalStep('recording');
      setStatus({ type: 'error', message: 'Failed to start recording. Please try again or check microphone permissions.' });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    
    // Always go to editing step when stopping - don't check text length
    setRecordingModalStep('editing');
  };

  const handleNavClick = (buttonId) => {
    switch(buttonId) {
      case 'write':
        setText('');
        setShowRecordingModal(true);
        setRecordingModalStep('editing');
        break;
      case 'user':
      case 'upload':
      case 'settings':
        console.log(`${buttonId} button clicked`);
        break;
      default:
        break;
    }
  };

  const transformStory = async () => {
    if (!text.trim()) {
      setStatus({ type: 'error', message: 'Please add some text first!' });
      return;
    }

    // Switch to processing step and start transformation
    setRecordingModalStep('processing');
    setIsProcessing(true);
    setProcessingStep(0);
    setResult(null);

    const steps = [
      'Analyzing your text...',
      'Detecting story format...',
      'Enhancing with AI...',
      'Finalizing your story...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      const response = await fetch('http://localhost:5001/api/enhance-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          format: selectedStyle,
          generateVisuals: selectedStyle === 'comic'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        setStatus({ 
          type: data.demo ? 'warning' : 'success', 
          message: data.demo ? 
            'Demo transformation complete! Connect OpenAI for full AI magic.' :
            'Your story has been transformed!'
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Processing error:', error);
      
      if (error.message.includes('Failed to fetch')) {
        setStatus({ 
          type: 'error', 
          message: 'Cannot connect to server. Make sure the backend is running on port 5001.' 
        });
      } else {
        const recovery = await errorRecovery.handleError('processing_failed', { originalText: text });
        setResult({ 
          original: text, 
          enhanced: `Enhanced: ${text}\n\n[Demo enhancement - connect OpenAI for full AI magic]`, 
          demo: true 
        });
        setStatus({ type: 'warning', message: recovery.data.message });
      }
    } finally {
      setIsProcessing(false);
      setShowRecordingModal(false);
      setRecordingModalStep('recording');
      setProcessingStep(0);
    }
  };

  const clearAll = () => {
    setText('');
    setResult(null);
    setStatus(null);
    setShowRecordingModal(false);
    setRecordingModalStep('recording');
    setProcessingStep(0);
    setShowFormatSelector(true);
    setSelectedStyle('');
  };

  const closeModal = () => {
    setShowModal(false);
    setModalContent(null);
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .comparison-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        textarea:focus {
          border-color: #667eea !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        
        .footer-button:hover {
          background: rgba(102, 126, 234, 0.1) !important;
          color: #667eea !important;
        }
        
        .back-button:hover {
          background: rgba(102, 126, 234, 0.1) !important;
          color: #667eea !important;
          border-color: #667eea !important;
        }
        
        .modal-back-button:hover {
          background: rgba(102, 126, 234, 0.1) !important;
          color: #667eea !important;
          border-color: #667eea !important;
        }
      `}</style>
      
      <div style={styles.header}>
        <h1 style={styles.logo}>AuraMythos</h1>
        <p style={styles.tagline}>Bringing Ideas to Realization. No Thought Required.</p>
        <p style={styles.description}>
          Just talk, and watch your words become something extraordinary. 
          Like having a personal storyteller who transforms your thoughts.
        </p>
      </div>

      {/* Format Selection Modal - appears on app start */}
      {showFormatSelector && (
        <div style={styles.modal}>
          <div style={styles.formatSelectorContent}>
            <h2 style={styles.formatSelectorHeader}>Which type of story would you like to create?</h2>
            <p style={styles.formatSelectorSubtext}>
              Choose your format, then start recording or writing your story
            </p>
            
            <div style={styles.formatGrid}>
              {Object.entries(storyFormats).map(([key, format]) => (
                <div
                  key={key}
                  onClick={() => handleFormatCardClick(key)}
                  style={styles.formatCard(selectedStyle === key)}
                >
                  <span style={styles.formatIcon}>{format.icon}</span>
                  <h3 style={styles.formatName}>{format.name}</h3>
                  <p style={styles.formatDescription}>{format.description}</p>
                </div>
              ))}
            </div>

            <button
              style={styles.formatSelectButton(!selectedStyle)}
              onClick={() => selectedStyle && selectFormat(selectedStyle)}
              disabled={!selectedStyle}
            >
              {selectedStyle ? `Create ${storyFormats[selectedStyle].name}` : 'Select a format above'}
            </button>
          </div>
        </div>
      )}

      {!showFormatSelector && !result && (
        <div style={styles.mainCard}>
          <button
            className="back-button"
            style={styles.backButton}
            onClick={goBackToFormatSelection}
            title="Choose different format"
          >
            ← Back
          </button>
          
          <h2 style={styles.recordingPrompt}>Ready to create your {storyFormats[selectedStyle]?.name.toLowerCase()}</h2>
          <p style={styles.recordingInstructions}>
            Just start talking about your idea, or click Write below to type it out.
          </p>

          <button
            style={styles.recordButton(false)}
            onClick={startRecording}
          >
            🎤
          </button>
        </div>
      )}

      {showRecordingModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            {recordingModalStep === 'recording' && (
              <>
                {/* Back button to return to editing */}
                <button
                  className="modal-back-button"
                  style={styles.modalBackButton}
                  onClick={() => setRecordingModalStep('editing')}
                  title="Back to editing"
                >
                  ← Back
                </button>
                
                <h2 style={styles.recordingHeader}>
                  {isRecording ? 'Recording...' : 'Ready to Record'}
                </h2>
                <p style={styles.recordingSubtext}>
                  {isRecording ? 
                    'Speak naturally. Tell me your story, idea, or dream!' :
                    'Click the microphone button below to start recording'
                  }
                </p>
                
                {isRecording && <VoiceVisualizer isRecording={isRecording} audioLevel={Math.random()} />}
                
                {isRecording ? (
                  <button
                    style={styles.stopButton}
                    onClick={stopRecording}
                  >
                    ⏹️
                  </button>
                ) : (
                  <button
                    style={styles.recordButton(false)}
                    onClick={() => {
                      setIsRecording(true);
                      setText(''); // Clear any previous text
                      recognitionRef.current.start();
                    }}
                  >
                    🎤
                  </button>
                )}
                
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '16px 0 0 0' }}>
                  {isRecording ? 
                    'Tap the stop button when you\'re done' :
                    'Tap the microphone to begin recording'
                  }
                </p>
              </>
            )}

            {recordingModalStep === 'editing' && (
              <>
                <h2 style={styles.textEditHeader}>Review & Edit Your Text</h2>
                <p style={styles.textEditSubtext}>
                  Make any changes you'd like before transforming your story
                </p>
                
                <textarea
                  style={styles.textArea}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={text.trim() ? "Edit your transcribed text..." : "No speech detected. You can type your story here instead."}
                  maxLength={5000}
                />
                
                {selectedStyle && (
                  <div style={styles.formatDetection}>
                    <span style={{ fontWeight: '600' }}>Creating:</span> {storyFormats[selectedStyle].name} {storyFormats[selectedStyle].icon}
                  </div>
                )}

                <div style={styles.modalActions}>
                  <button
                    style={styles.actionButton('primary')}
                    onClick={transformStory}
                    disabled={!text.trim() || isProcessing}
                  >
                    {isProcessing && <span style={styles.loadingSpinner} />}
                    {isProcessing ? 'Transforming...' : 'Transform My Story'}
                  </button>
                  <button
                    style={styles.actionButton('danger')}
                    onClick={() => {
                      setRecordingModalStep('recording');
                      setIsRecording(false);
                      setText(''); // Clear previous text
                    }}
                  >
                    🎤 Record Again
                  </button>
                  <button
                    style={styles.actionButton('secondary')}
                    onClick={() => {
                      setShowRecordingModal(false);
                      setRecordingModalStep('recording');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {recordingModalStep === 'processing' && (
              <>
                <h2 style={styles.processingHeader}>Creating Your Story...</h2>
                <p style={styles.processingSubtext}>
                  Watch as your words transform into something extraordinary
                </p>
                
                <div style={styles.processingSpinner} />
                
                <div style={styles.processingSteps}>
                  {['Analyzing your text', 'Detecting story format', 'Enhancing with AI', 'Finalizing your story'].map((step, index) => (
                    <div key={index} style={styles.processingStep(processingStep === index, processingStep > index)}>
                      <div style={styles.stepIcon(processingStep === index, processingStep > index)}>
                        {processingStep > index ? '✓' : index + 1}
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
                
                <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '24px' }}>
                  This usually takes 10-30 seconds
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {status && (
        <div style={styles.statusMessage(status.type)}>
          {status.message}
        </div>
      )}

      {result && (
        <div style={styles.resultsSection}>
          <div style={styles.resultsCard}>
            <div style={styles.resultsHeader}>
              <h2 style={styles.resultsTitle}>Your Transformed Story</h2>
              <div style={styles.resultsStats}>
                <span>📝 {result.wordCount || text.split(' ').length} words</span>
                <span>⚡ {storyFormats[selectedStyle]?.name}</span>
              </div>
            </div>
            
            <div style={styles.comparisonGrid} className="comparison-grid">
              <div style={styles.comparisonSection(false)}>
                <h3 style={styles.comparisonTitle(false)}>Original</h3>
                <div style={styles.comparisonText}>
                  {result.original}
                </div>
              </div>
              
              <div style={styles.comparisonSection(true)}>
                <h3 style={styles.comparisonTitle(true)}>Transformed</h3>
                <div style={styles.comparisonText}>
                  {result.enhanced}
                </div>
              </div>
            </div>

            <div style={styles.modalActions}>
              {result.downloadUrls && Object.entries(result.downloadUrls).map(([format, url]) => (
                <a
                  key={format}
                  href={`http://localhost:5001${url}`}
                  download
                  style={styles.actionButton('primary')}
                >
                  📄 Download {format.toUpperCase()}
                </a>
              ))}
              <button
                onClick={clearAll}
                style={styles.actionButton('secondary')}
              >
                🔄 Start Over
              </button>
            </div>

            {result.demo && (
              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: '#fffbeb',
                borderRadius: '12px',
                border: '1px solid #fed7aa',
                textAlign: 'center',
                fontSize: '14px',
                color: '#92400e'
              }}>
                <strong>Demo Mode:</strong> This is a preview! Connect your OpenAI API key for full AI transformation magic.
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && modalContent && (
        <div style={styles.modal} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.textEditHeader}>{modalContent.title}</h2>
            <p style={styles.textEditSubtext}>{modalContent.message}</p>
            <div style={styles.modalActions}>
              <button
                onClick={closeModal}
                style={styles.actionButton('primary')}
              >
                {modalContent.action || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          {bottomNavButtons.map((button) => (
            <button
              key={button.id}
              className="footer-button"
              style={styles.footerButton}
              onClick={() => handleNavClick(button.id)}
            >
              <div style={styles.footerButtonIcon}>{button.icon}</div>
              <span>{button.label}</span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default App;