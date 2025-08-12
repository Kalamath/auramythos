import React, { useState, useEffect, useRef } from 'react';

// Demo story content
const demoContent = {
  scifi: {
    title: "The Last Signal",
    original: "So like... okay, there's this astronaut, right? And she's been alone on this space station for... I don't know, maybe three months? The thing is, Earth stopped responding to her messages two weeks ago. Complete radio silence. She's got enough supplies for another year, but the isolation is getting to her. Then yesterday, she picks up this weird signal from somewhere deep in space - not from Earth, but it's definitely artificial. It's repeating every 47 minutes. Should she respond? What if it's dangerous? But what if it's her only chance to connect with someone... or something?",
    
    enhanced: {
      comic: `🎨 COMIC BOOK FORMAT

┌─────────────────────────────────────┐
│ PANEL 1 - WIDE SHOT                │
│                                     │
│ The ISS Horizon floats against     │
│ the infinite void. Earth below,    │
│ half in shadow.                    │
│                                     │
│ CAPTION: "Day 97 in orbit..."      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ PANEL 2 - INT. OBSERVATION DECK    │
│                                     │
│ COMMANDER SARAH CHEN floats by     │
│ the window. Dark circles. Tired.   │
│                                     │
│  ╭─────────────────────────╮       │
│  │ Day 97. Still no word   │       │
│  │ from Houston...         │       │
│  ╰─────────────────────────╯       │
│        (thought bubble)             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ PANEL 3 - CLOSE ON CONSOLE         │
│                                     │
│ Red lights blink. Screen shows:    │
│ "12 FAILED TRANSMISSIONS"          │
│                                     │
│ SFX: *BLINK* *BLINK* *BLINK*      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ PANEL 4 - SARAH AT CONTROLS        │
│                                     │
│ She reaches for the transmit       │
│ button. Hesitates.                 │
│                                     │
│  ╭─────────────────────────╮       │
│  │ ISS Horizon to Mission  │       │
│  │ Control. Please respond.│       │
│  │ ...Anyone?              │       │
│  ╰──────────┬──────────────╯       │
│             ◯ (speech bubble)       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ PANEL 5 - THE SIGNAL!              │
│                                     │
│ Console ERUPTS with lights!        │
│ Alien pattern on screen!           │
│                                     │
│ SFX: BEEP! BEEP! BEEP!            │
│                                     │
│ CAPTION: "Signal origin: Unknown"  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ PANEL 6 - EXTREME CLOSE: EYES      │
│                                     │
│ Sarah's eyes. Wide. Terror mixed   │
│ with desperate hope.               │
│                                     │
│  ╭─────────────────────────╮       │
│  │ That's... not from     │       │
│  │ Earth.                 │       │
│  ╰─────────────────────────╯       │
│        (whisper bubble)            │
└─────────────────────────────────────┘`,

      screenplay: `📽️ SCREENPLAY FORMAT


                    THE LAST SIGNAL

                         Written by
                      
                      AuraMythos AI


FADE IN:

INT. ISS HORIZON - OBSERVATION DECK - DAY (SHIP TIME)

The curved observation window frames Earth below. 
Tablets and equipment float in zero gravity.

COMMANDER SARAH CHEN (30s), exhausted but alert, 
floats near the window. Her tablet displays: 
"TRANSMISSION FAILED" in red letters.

                    SARAH
          (to herself)
     Day 97. Still nothing.

She pushes off the wall, gliding toward--

THE COMMUNICATION CONSOLE

Red status lights blink steadily. A rhythmic, 
mechanical heartbeat.

                    SARAH (CONT'D)
          (into microphone)
     ISS Horizon to Houston Control.
     This is Commander Chen. Priority
     status update. Please respond.

STATIC fills the speakers. Nothing else.

                    SARAH (CONT'D)
          (quieter)
     Anyone...

SUDDENLY--

The console ERUPTS. Lights flash in patterns never 
seen before. Alarms sound.

ON THE CONSOLE SCREEN:

A waveform pulses. Text appears: 
"SIGNAL ORIGIN: UNKNOWN"
"DISTANCE: 4.7 BILLION KM"

Sarah's face pales. She grabs the console to steady 
herself.

                    SARAH (CONT'D)
          (whispered)
     Oh my god.

She checks the trajectory data. Her hands shake.

                    SARAH (CONT'D)
     That's... that's not from 
     Earth.

INSERT - CONSOLE DISPLAY

"SIGNAL REPEAT: 47 MINUTES"
"PATTERN: ARTIFICIAL"

BACK TO SARAH

She stares at the display. Her reflection in the 
dark screen shows haunted eyes.

                    SARAH (CONT'D)
          (to herself)
     Do I answer?

FADE OUT.

END OF SCENE`,

      book: `📖 NOVEL FORMAT

CHAPTER ONE
Signal in the Void

     The silence was the worst part.
     
     Commander Sarah Chen pressed her palm against the observation deck's window, feeling the cold seep through the triple-layered thermoglass. Earth hung below—or was it above? After ninety-seven days alone on the ISS Horizon, concepts like "up" and "down" had lost all meaning.
     
     She'd stopped counting the failed transmissions after the fortieth attempt. Houston had gone dark two weeks ago, cutting her off mid-sentence during a routine status report. One moment, she'd been reading atmospheric pressure data; the next, nothing but the cosmic hiss of background radiation.
     
     "Day 97," she whispered to the voice recorder floating beside her. "Still no response from Mission Control. Supplies holding steady—thirteen months remaining if I maintain current consumption rates. Solar panels operating at 94% efficiency. Life support nominal."
     
     She paused, then added in a smaller voice: "Crew morale... deteriorating."
     
     The joke fell flat even to her own ears. There was no crew. Just her, four hundred kilometers above a silent Earth, traveling at seven point six kilometers per second toward nowhere.
     
     The communication console behind her suddenly erupted in a cascade of lights and alerts. Sarah's heart lurched—finally, contact! She pushed off the window, sending herself floating across the module in practiced movements.
     
     But as she reached the console, her relief crystallized into confusion, then something deeper. Something primal.
     
     The signal pattern was all wrong. The frequency, the modulation, the point of origin—everything about it screamed one impossible truth: This wasn't coming from Earth.
     
     The display showed the source: beyond Neptune's orbit, impossibly far, repeating every forty-seven minutes with mechanical precision.
     
     Sarah's hand hovered over the response controls. In the reflection of the dark screen, she could see her own haunted eyes staring back. Two weeks of isolation. Ninety-seven days of slow-burning solitude. And now this.
     
     She had to make a choice that might determine not just her fate, but possibly humanity's: Should she answer?
     
     The signal pulsed again. Forty-seven minutes. Like clockwork.
     
     Like something waiting.`
    }
  }
};

// Component for displaying the demo story with typewriter effect
const DemoStoryViewer = ({ content, format, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (currentIndex < content.length && isTyping) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + content[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 20); // Typing speed
      
      return () => clearTimeout(timeout);
    } else if (currentIndex >= content.length) {
      setIsTyping(false);
      if (onComplete) onComplete();
    }
  }, [currentIndex, content, isTyping, onComplete]);

  // Auto-scroll to follow text
  useEffect(() => {
    if (containerRef.current && isTyping) {
      const scrollContainer = containerRef.current.closest('.scrollable-content');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [displayedText, isTyping]);
  
  return (
    <span ref={containerRef}>
      {displayedText}
      {isTyping && (
        <span style={{
          animation: 'blink 1s infinite',
          marginLeft: '2px',
          color: '#667eea'
        }}>|</span>
      )}
    </span>
  );
};

// Main demo system component - renders directly in notebook
const DemoStorySystem = ({ 
  initialGenre = 'scifi', 
  initialFormat = 'comic',
  autoStart = false,
  onExit
}) => {
  const [currentStage, setCurrentStage] = useState('intro');
  const [selectedFormat, setSelectedFormat] = useState(initialFormat);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEnhanced, setShowEnhanced] = useState(false);
  const [userName, setUserName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [enhancementComplete, setEnhancementComplete] = useState(false);
  
  const story = demoContent[initialGenre];
  
  useEffect(() => {
    if (autoStart) {
      // Auto-start the demo flow
      setTimeout(() => {
        setCurrentStage('welcome');
      }, 500);
    }
  }, [autoStart]);
  
  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      setCurrentStage('intro');
    }
  };
  
  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
    setIsProcessing(true);
    setCurrentStage('processing');
    
    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false);
      setShowEnhanced(true);
      setCurrentStage('showing_enhanced');
    }, 3000);
  };
  
  const handleRestart = () => {
    setCurrentStage('format_selection');
    setShowEnhanced(false);
    setEnhancementComplete(false);
    setIsProcessing(false);
  };
  
  const handleExit = () => {
    if (onExit) {
      onExit();
    }
  };
  
  return (
    <>
      {/* Demo Mode indicator - subtle, at top */}
      <div style={{ 
        marginBottom: '20px',
        fontSize: '13px',
        color: '#667eea',
        fontStyle: 'italic'
      }}>
        🎬 Demo Mode - {story.title}
      </div>
      
      {/* Stage: Welcome */}
      {currentStage === 'welcome' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            Welcome to AuraMythos! ✨
          </div>
          <div style={{ marginBottom: '16px' }}>
            Let's transform your story into something legendary. What should I call you?
          </div>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Enter your name..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleNameSubmit();
                }
              }}
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                border: 'none',
                borderBottom: '1px solid #cbd5e1',
                background: 'transparent',
                fontFamily: 'inherit',
                width: '200px',
                color: '#2c3e50',
                outline: 'none'
              }}
              autoFocus
            />
            <button 
              onClick={handleNameSubmit}
              style={{
                marginLeft: '12px',
                padding: '6px 16px',
                background: nameInput.trim() ? '#667eea' : '#e2e8f0',
                color: nameInput.trim() ? 'white' : '#94a3b8',
                border: 'none',
                borderRadius: '4px',
                cursor: nameInput.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
              disabled={!nameInput.trim()}
            >
              Begin →
            </button>
          </div>
        </>
      )}
      
      {/* Stage: Intro */}
      {currentStage === 'intro' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            Hi {userName}! 👋
          </div>
          <div style={{ marginBottom: '16px' }}>
            I'm going to show you how AuraMythos transforms rough ideas into 
            polished, professional stories. Let's start with a raw story idea 
            someone shared with us...
          </div>
          <div style={{ marginBottom: '16px' }}>
            <button 
              onClick={() => setCurrentStage('showing_original')}
              style={{
                padding: '6px 16px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            >
              Show Me ✨
            </button>
          </div>
        </>
      )}
      
      {/* Stage: Showing Original */}
      {(currentStage === 'showing_original' || 
        currentStage === 'format_selection' || 
        currentStage === 'processing' || 
        currentStage === 'showing_enhanced') && (
        <>
          <div style={{ 
            marginBottom: '12px',
            color: '#667eea',
            fontWeight: '600'
          }}>
            📝 Original Story (as told by {userName || 'the user'}):
          </div>
          <div style={{
            marginBottom: '20px',
            paddingLeft: '12px',
            borderLeft: '2px solid #667eea'
          }}>
            {story.original}
          </div>
          
          {currentStage === 'showing_original' && (
            <div style={{ marginBottom: '16px' }}>
              <button 
                onClick={() => setCurrentStage('format_selection')}
                style={{
                  padding: '6px 16px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              >
                Transform This Story →
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Stage: Format Selection */}
      {currentStage === 'format_selection' && (
        <>
          <div style={{ 
            marginBottom: '16px',
            color: '#667eea',
            fontWeight: '600'
          }}>
            ✨ Choose your story format:
          </div>
          <div style={{ marginBottom: '16px' }}>
            {['comic', 'screenplay', 'book'].map((format) => (
              <button 
                key={format}
                onClick={() => handleFormatSelect(format)}
                style={{
                  padding: '6px 16px',
                  marginRight: '8px',
                  background: selectedFormat === format ? '#667eea' : 'transparent',
                  color: selectedFormat === format ? 'white' : '#2c3e50',
                  border: `1px solid ${selectedFormat === format ? '#667eea' : '#cbd5e1'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              >
                {format === 'comic' ? '🎨 Comic' : 
                 format === 'screenplay' ? '📽️ Screenplay' : 
                 '📖 Novel'}
              </button>
            ))}
          </div>
        </>
      )}
      
      {/* Stage: Processing */}
      {currentStage === 'processing' && isProcessing && (
        <div style={{ 
          textAlign: 'center', 
          padding: '32px 0'
        }}>
          <div style={{
            fontSize: '24px',
            marginBottom: '16px',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            ✨
          </div>
          <div style={{ 
            color: '#667eea', 
            fontWeight: '600'
          }}>
            Weaving magic into your story...
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#64748b', 
            marginTop: '8px'
          }}>
            Transforming to {selectedFormat} format
          </div>
        </div>
      )}
      
      {/* Stage: Showing Enhanced */}
      {currentStage === 'showing_enhanced' && showEnhanced && (
        <>
          <div style={{ 
            marginBottom: '12px',
            color: '#667eea',
            fontWeight: '600'
          }}>
            ✨ Your Enhanced Story:
          </div>
          <div style={{
            marginBottom: '20px',
            paddingLeft: '12px',
            borderLeft: '2px solid #764ba2'
          }}>
            <DemoStoryViewer 
              content={story.enhanced[selectedFormat]}
              format={selectedFormat}
              onComplete={() => setEnhancementComplete(true)}
            />
          </div>
          
          {/* Demo Complete - Only shows after typing is done */}
          {enhancementComplete && (
            <>
              <div style={{ 
                marginTop: '24px',
                marginBottom: '16px',
                padding: '16px',
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '4px',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{ 
                  color: '#059669', 
                  fontWeight: '600', 
                  marginBottom: '8px'
                }}>
                  🎉 Demo Complete!
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: '#64748b'
                }}>
                  In the full version, you get even more powerful AI enhancements,
                  visual generation, and export options!
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <button 
                  onClick={handleRestart}
                  style={{
                    padding: '6px 16px',
                    marginRight: '8px',
                    background: 'transparent',
                    color: '#667eea',
                    border: '1px solid #667eea',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                >
                  Try Another Format
                </button>
                <button 
                  onClick={handleExit}
                  style={{
                    padding: '6px 16px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                >
                  Start Creating
                </button>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};

export { DemoStorySystem, DemoStoryViewer };