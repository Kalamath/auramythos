import React, { useState, useRef, useEffect } from 'react';

function App() {
  // Device detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Core app state
  const [appState, setAppState] = useState({
    currentStep: 'landing',
    currentStage: 'naming',
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
    name: '',
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
      }, 100);
    }
  }, [conversationState.awaitingInput, isMobile]);

  // Show microphone with fade-in animation on mobile when awaiting input
  useEffect(() => {
    if (isMobile && conversationState.awaitingInput && recordingState.isSupported) {
      setTimeout(() => {
        updateRecordingState({ showMicrophone: true });
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

  const addStoryChoices = () => {
    setConversationState(prev => ({ 
      ...prev,
      messages: [...prev.messages, { 
        type: 'story_choices', 
        content: '', 
        timestamp: Date.now() 
      }]
    }));
  };

  // Handle story choice clicks
  const handleStoryChoice = (choice) => {
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
        queueMessages([
          { text: "I'd love to know what to call you!", delay: 500 },
          { type: 'input', placeholder: isMobile ? "Tap the microphone to say your name..." : "Type your name...", delay: 0 }
        ]);
        return;
      }

      updateUserContent({ name: trimmedName });
      
      // Check if name seems unique or might need spelling confirmation
      const needsConfirmation = trimmedName.length > 8 || /[^a-zA-Z\s]/.test(trimmedName) || 
                               ['Aiden', 'Kayden', 'Braiden', 'Jaxon', 'Jaxxon', 'Kaitlyn', 'Caitlin'].some(n => 
                                 trimmedName.toLowerCase().includes(n.toLowerCase()));

      if (needsConfirmation) {
        updateAppState({ currentStage: 'name_confirmation' });
        queueMessages([
          { text: `Nice to meet you, ${trimmedName}!`, delay: 800 },
          { text: "Is that spelled correctly?", delay: 800 },
          { type: 'input', placeholder: isMobile ? "Say 'yes' or spell it differently..." : "Type 'yes' or spell it differently...", delay: 0 }
        ]);
      } else {
        updateAppState({ currentStage: 'story_type_selection' });
        queueMessages([
          { text: `Nice to meet you, ${trimmedName}! 🌟`, delay: 800 },
          { text: "I'm so excited to help you create something amazing together.", delay: 1000 },
          { text: "What kind of story would you like to tell?", delay: 1000 },
          { type: 'story_choices', delay: 1200 }
        ]);
      }
    } else if (appState.currentStage === 'name_confirmation') {
      const lowerInput = input.toLowerCase().trim();
      
      if (lowerInput === 'yes' || lowerInput === 'correct' || lowerInput === 'right') {
        const userName = userContent.name;
        updateAppState({ currentStage: 'story_type_selection' });
        queueMessages([
          { text: `Nice to meet you, ${userName}! 🌟`, delay: 800 },
          { text: "I'm so excited to help you create something amazing together.", delay: 1000 },
          { text: "What kind of story would you like to tell?", delay: 1000 },
          { type: 'story_choices', delay: 1200 }
        ]);
      } else {
        // Treat the input as a corrected name
        updateUserContent({ name: input.trim() });
        updateAppState({ currentStage: 'story_type_selection' });
        queueMessages([
          { text: `Nice to meet you, ${input.trim()}! 🌟`, delay: 800 },
          { text: "I'm so excited to help you create something amazing together.", delay: 1000 },
          { text: "What kind of story would you like to tell?", delay: 1000 },
          { type: 'story_choices', delay: 1200 }
        ]);
      }
    } else if (appState.currentStage === 'story_type_selection') {
      handleStoryTypeSelection(input);
    } else if (appState.currentStage === 'storytelling') {
      handleStorySubmission(input);
    } else if (appState.currentStage === 'choice') {
      handleChoiceSelection(input);
    } else if (appState.currentStage === 'branching') {
      handleBranchCreation(input);
    } else if (appState.currentStage === 'refining') {
      handleRefinement(input);
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
      updateAppState({ 
        selectedStyle: selectedType,
        currentStage: 'storytelling' 
      });
      
      const isInteractive = ['game', 'interactive'].includes(selectedType);
      
      if (isInteractive) {
        queueMessages([
          { text: `Excellent! Let's create your ${selectedType === 'game' ? 'game narrative' : 'interactive story'}. 🎮`, delay: 800 },
          { text: "Tell me your main story concept - we'll add choices and branches next.", delay: 800 },
          { text: isMobile ? "🎤 Use the microphone to share your ideas!" : "🎤 You can also use the microphone button to record your ideas!", delay: 800 },
          { type: 'input', placeholder: isMobile ? `Tap the microphone to describe your ${selectedType} story...` : `Describe your ${selectedType} story concept...`, delay: 800 }
        ]);
      } else {
        queueMessages([
          { text: `Perfect! Let's create your ${selectedType}. 📚`, delay: 800 },
          { text: "Tell me your story - you can share it with me now.", delay: 800 },
          { text: isMobile ? "🎤 Tap the microphone to begin!" : "🎤 You can also use the microphone button to record your voice!", delay: 800 },
          { type: 'input', placeholder: isMobile ? `Tap the microphone to tell your ${selectedType} story...` : `Tell me your ${selectedType} story...`, delay: 800 }
        ]);
      }
    } else {
      queueMessages([
        { text: "I didn't quite catch that. Please choose: book, comic, screenplay, content, game, or interactive.", delay: 500 },
        { type: 'input', placeholder: isMobile ? "Tap the microphone to say your choice..." : "Type your choice...", delay: 0 }
      ]);
    }
  };

  const handleStorySubmission = (input) => {
    if (input.length < 10) {
      queueMessages([
        { text: "That's a bit short! Please tell me more about your story (at least 10 characters).", delay: 0 },
        { type: 'input', placeholder: isMobile ? `Tap the microphone to continue your ${appState.selectedStyle} story...` : `Continue your ${appState.selectedStyle} story...`, delay: 0 }
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
        { type: 'input', placeholder: isMobile ? "Say 'enhance', 'branches', or 'refine'..." : "Type 'enhance', 'branches', or 'refine'...", delay: 800 }
      ]);
    } else {
      queueMessages([
        { text: "Wonderful! I can see your creative energy flowing. ✨", delay: 800 },
        { text: "How would you like me to help you with this story?", delay: 800 },
        { text: "✨ Enhance - I'll use AI magic to transform and improve it", delay: 800 },
        { text: "✏️ Refine - You can make manual edits and improvements", delay: 800 },
        { type: 'input', placeholder: isMobile ? "Say 'enhance' or 'refine'..." : "Type 'enhance' or 'refine'...", delay: 800 }
      ]);
    }
  };

  const handleChoiceSelection = (input) => {
    const lowerInput = input.toLowerCase();
    const isInteractive = ['game', 'interactive'].includes(appState.selectedStyle);
    
    if (lowerInput.includes('enhance')) {
      enhanceStory();
    } else if (lowerInput.includes('refine')) {
      refineStory();
    } else if (isInteractive && lowerInput.includes('branch')) {
      createBranches();
    } else {
      const choices = isInteractive 
        ? "Please choose 'enhance', 'refine', or 'branches'."
        : "Please choose 'enhance' or 'refine'.";
      queueMessages([
        { text: choices, delay: 0 },
        { type: 'input', placeholder: isMobile ? "Tap the microphone to say your choice..." : "Type your choice...", delay: 0 }
      ]);
    }
  };

  const handleBranchCreation = (input) => {
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
        { type: 'input', placeholder: isMobile ? "Tap the microphone to describe the choices..." : "Enter the choices (or type 'done' to finish)...", delay: 0 }
      ]);
    }
  };

  const handleRefinement = (input) => {
    queueMessages([
      { text: "I understand! Let me help you refine that part.", delay: 500 },
      { text: `You want to improve: "${input}"`, delay: 800 },
      { text: "In the full version, I would provide specific suggestions and edits.", delay: 800 },
      { text: "For now, your story has been noted for refinement! ✏️", delay: 800 },
      { text: "Type 'enhance' to continue with AI enhancement, or 'done' to finish.", delay: 800 },
      { type: 'input', placeholder: isMobile ? "Say 'enhance' or 'done'..." : "Type 'enhance' or 'done'...", delay: 0 }
    ]);
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
        ? "🎮 Ready to add player choices? Say 'branches' to create interactive paths!" 
        : "🎉 Your story transformation is complete! You can scroll up to review the entire conversation anytime.", 
        delay: 800 
      }
    ]);
    
    if (isInteractive) {
      queueMessages([
        { type: 'input', placeholder: isMobile ? "Say 'branches' to add choices, or 'done' to finish..." : "Type 'branches' to add choices, or 'done' to finish...", delay: 800 }
      ]);
      updateAppState({ currentStage: 'branching' });
    }
  };

  const createBranches = () => {
    updateAppState({ currentStage: 'branching' });
    
    addSystemMessage("🌿 Let's create branching paths for your story!");
    
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
      { type: 'input', placeholder: isMobile ? "Tap the microphone to describe a choice moment..." : "Describe a moment where the player makes a choice...", delay: 0 }
    ]);
  };

  const refineStory = () => {
    queueMessages([
      { text: "Great choice! Let's refine your story together. ✏️", delay: 500 },
      { text: "Here's your current story:", delay: 800 },
      { text: `"${userContent.story}"`, delay: 800 },
      { text: "What would you like to change or improve?", delay: 800 },
      { type: 'input', placeholder: isMobile ? "Tap the microphone to describe what you'd like to refine..." : "Describe what you'd like to refine...", delay: 0 }
    ]);
    
    updateAppState({ currentStage: 'refining' });
  };

  // Speech recognition setup
  useEffect(() => {
    if (appState.currentStep === 'conversation') {
      const isSupported = initSpeechRecognition();
      updateRecordingState({ isSupported });
    }
    return () => {
      if (refs.recognition.current) {
        refs.recognition.current.stop();
      }
    };
  }, [appState.currentStep]);

  const initSpeechRecognition = () => {
    console.log('Initializing speech recognition...');
    
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn('Speech Recognition not supported in this browser.');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    refs.recognition.current = new SpeechRecognition();
    refs.recognition.current.continuous = true;
    refs.recognition.current.interimResults = true;
    refs.recognition.current.lang = 'en-US';

    refs.recognition.current.onstart = () => {
      console.log('Speech recognition started');
      refs.lastProcessedIndex.current = 0;
    };

    refs.recognition.current.onresult = (event) => {
      console.log('Speech recognition result received');
      let newFinalTranscript = '';
      
      for (let i = refs.lastProcessedIndex.current; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinalTranscript += transcript + ' ';
        }
      }
      
      refs.lastProcessedIndex.current = event.results.length;
      
      if (newFinalTranscript.trim()) {
        console.log('Final transcript:', newFinalTranscript.trim());
        if (isMobile) {
          handleUserSubmit(newFinalTranscript.trim());
        } else {
          updateUserContent(prev => ({ ...prev, input: prev.input + newFinalTranscript }));
        }
      }
    };

    refs.recognition.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      updateRecordingState({ isRecording: false });
      
      if (event.error === 'not-allowed') {
        alert('Microphone access was denied. Please allow microphone access and try again.');
      } else if (event.error === 'no-speech') {
        console.log('No speech detected, stopping recording');
      } else {
        alert(`Speech recognition error: ${event.error}`);
      }
    };

    refs.recognition.current.onend = () => {
      console.log('Speech recognition ended');
      updateRecordingState({ isRecording: false });
    };

    console.log('Speech recognition initialized successfully');
    return true;
  };

  const toggleRecording = async () => {
    console.log('toggleRecording called, isRecording:', recordingState.isRecording);
    
    if (recordingState.isRecording) {
      console.log('Stopping recording...');
      refs.recognition.current?.stop();
      updateRecordingState({ isRecording: false });
    } else {
      try {
        console.log('Requesting microphone access...');
        // Request microphone access first
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone access granted');
        
        // Stop the stream immediately as we only needed permission
        stream.getTracks().forEach(track => track.stop());
        
        if (!refs.recognition.current) {
          console.log('No speech recognition available');
          alert('Speech recognition is not available in this browser. Please try Chrome, Safari, or Edge.');
          return;
        }
        
        console.log('Starting speech recognition...');
        updateRecordingState({ isRecording: true });
        refs.recognition.current.start();
        
      } catch (error) {
        console.error('Microphone access error:', error);
        
        if (error.name === 'NotAllowedError') {
          alert('Microphone access was denied. Please allow microphone access in your browser settings and try again.');
        } else if (error.name === 'NotFoundError') {
          alert('No microphone was found on your device.');
        } else if (error.name === 'NotSupportedError') {
          alert('Your browser does not support microphone access.');
        } else {
          alert('There was an error accessing your microphone. Please try again.');
        }
        
        updateRecordingState({ isRecording: false });
      }
    }
  };

  // Determine main container background based on step and device
  const mainBackground = appState.currentStep === 'landing' 
    ? 'linear-gradient(135deg, #4c5aa7 0%, #5a4a7a 100%)'
    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';

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
    backgroundImage: `repeating-linear-gradient(
      transparent,
      transparent 27px,
      #e8f4fd 27px,
      #e8f4fd 28px
    )`,
    '--margin-left': isMobile ? '40px' : '80px',
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

          @keyframes fadeInUpDesktop {
            0% {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
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

          .microphone-icon svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
          }

          .stop-icon {
            width: 14px;
            height: 14px;
            background: currentColor;
            border-radius: 2px;
          }

          .desktop-input-area {
            animation: fadeInUpDesktop 0.8s ease-out;
          }

          .input-area-ready {
            animation: pulseGlow 2s ease-out;
          }

          .lets-begin-button:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
            background: rgba(255, 255, 255, 0.25) !important;
          }

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

          .mobile-message.loading {
            color: #9ca3af;
            font-style: italic;
            margin-left: calc(var(--margin-left) + 10px);
            margin-right: 10px;
          }

          .floating-microphone {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            color: white;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 100;
            animation: fadeInUp 0.8s ease-out;
          }

          .floating-microphone.recording {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
            animation: pulse 1.5s ease-in-out infinite;
          }

          .floating-microphone:active {
            transform: translateX(-50%) scale(0.95);
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
            text-decoration: none;
            position: relative;
            border-radius: 4px;
            min-height: 36px;
          }

          .story-choice:hover {
            background-color: rgba(102, 126, 234, 0.08);
          }

          .story-choice:active {
            background-color: rgba(102, 126, 234, 0.15);
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
            className="lets-begin-button"
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
            ...paperStyles,
            width: isMobile ? '100%' : '700px',
            height: isMobile ? '100vh' : '800px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: isMobile ? 'none' : 'rotateX(5deg) rotateY(-2deg)',
            animation: !isMobile && appState.showNotebook ? 'gentleFloat 6s ease-in-out infinite' : 'none',
            opacity: appState.showNotebook ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
            visibility: appState.showNotebook ? 'visible' : 'hidden',
            zIndex: 2,
            willChange: 'transform',
            borderRadius: isMobile ? '0' : '3px',
            overflow: 'hidden'
          }}
          className="paper-container"
        >
          {/* SCROLLABLE CONVERSATION */}
          <div 
            className="scrollable-content"
            style={{
              ...(isMobile ? {
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                paddingTop: '80px',
                paddingBottom: '140px',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: "'Special Elite', 'Courier New', monospace",
                fontSize: '16px',
                lineHeight: '1.8',
                color: '#2c3e50',
                scrollBehavior: 'smooth',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              } : {
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
              if (message.type === 'input') return null;
              
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
              <div 
                className={isMobile ? 'mobile-message system' : ''}
                style={{
                  marginBottom: '12px',
                  lineHeight: '1.8',
                  minHeight: '28.8px',
                  ...(isMobile ? {} : {})
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
                    animation: isMobile ? 'blink 1s infinite' : 'none'
                  }} />
                )}
              </div>
            )}
            
            <div ref={refs.messagesEnd} />
          </div>

          {/* INPUT AREA - Desktop Only */}
          {!isMobile && conversationState.awaitingInput && (
            <div 
              className="desktop-input-area"
              style={{
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
              <div style={{ flex: 1, display: 'flex' }}>
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
              </div>
              
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
                
                {recordingState.isSupported && (
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
                    {recordingState.isRecording ? (
                      <div className="stop-icon"></div>
                    ) : (
                      <div className="microphone-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                        </svg>
                      </div>
                    )}
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
                  onClick={() => handleUserSubmit()}
                  disabled={!userContent.input.trim()}
                  title="Send message (Shift+Enter)"
                >
                  ↗
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FLOATING MICROPHONE BUTTON - Mobile Only */}
      {isMobile && recordingState.showMicrophone && (
        <button
          onClick={toggleRecording}
          className={`floating-microphone ${recordingState.isRecording ? 'recording' : ''}`}
          title={recordingState.isRecording ? "Tap to stop recording" : "Tap to start recording"}
        >
          {recordingState.isRecording ? (
            <div style={{
              width: '20px',
              height: '20px',
              background: 'currentColor',
              borderRadius: '3px'
            }}></div>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

export default App;