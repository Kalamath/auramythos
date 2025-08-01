const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const sharp = require('sharp'); // For image processing
require('dotenv').config();

// AI APIs
const OpenAI = require('openai');

const app = express();
const PORT = 5001;

// Initialize AI services
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

// PHASE 3: Visual Generation Configuration
const VISUAL_CONFIG = {
  // Image generation services
  services: {
    dalle: {
      enabled: !!process.env.OPENAI_API_KEY,
      model: 'dall-e-3',
      maxSize: '1024x1024',
      quality: 'standard'
    },
    midjourney: {
      enabled: !!process.env.MIDJOURNEY_API_KEY,
      endpoint: process.env.MIDJOURNEY_ENDPOINT || 'https://api.midjourney.com/v1/',
      styles: ['comic', 'anime', 'realistic', 'sketch']
    },
    stability: {
      enabled: !!process.env.STABILITY_API_KEY,
      endpoint: 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image'
    }
  },
  
  // Comic panel specifications
  panels: {
    standardSizes: {
      'standard': { width: 800, height: 600 },
      'wide': { width: 1200, height: 400 },
      'tall': { width: 400, height: 800 },
      'square': { width: 600, height: 600 }
    },
    layoutTemplates: {
      '1-panel': [{ type: 'standard', position: 'full' }],
      '2-panel': [
        { type: 'standard', position: 'left' },
        { type: 'standard', position: 'right' }
      ],
      '3-panel': [
        { type: 'wide', position: 'top' },
        { type: 'standard', position: 'bottom-left' },
        { type: 'standard', position: 'bottom-right' }
      ],
      '4-panel': [
        { type: 'standard', position: 'top-left' },
        { type: 'standard', position: 'top-right' },
        { type: 'standard', position: 'bottom-left' },
        { type: 'standard', position: 'bottom-right' }
      ]
    }
  }
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));
app.use('/outputs', express.static('outputs'));
app.use('/images', express.static('generated_images'));

// UPDATED: Iterative formatting templates for shorter responses
const formatTemplates = {
  book: {
    name: 'Illustrated Novel',
    prompt: `You are helping develop a novel paragraph by paragraph. For this user input:
    - Write only ONE engaging paragraph (3-4 sentences maximum)
    - Focus on advancing the story naturally from the previous context
    - End with a moment that invites continuation
    - Ask what happens next or request more details about a specific element
    - Keep the tone consistent with the story so far
    - DO NOT write multiple paragraphs or rush the story
    
    Always end your response with a specific question asking for more context, like:
    "What happens next?" or "Tell me more about [character/situation]" or "How does [character] react to this?"`,
    
    visualPrompts: (scenes) => scenes.map(scene => ({
      type: 'illustration',
      style: 'detailed painting, book illustration style',
      prompt: `Book illustration: ${scene.description}, detailed artwork, professional book illustration style`
    }))
  },
  
  story: {
    name: 'Illustrated Story',
    prompt: `You are collaboratively writing a short story paragraph by paragraph. For this input:
    - Add only ONE paragraph (3-4 sentences maximum) that builds on the story
    - Develop one key story element (character, plot, or setting)
    - Create natural story progression without rushing to the conclusion
    - Ask for specific details about what happens next
    - DO NOT try to wrap up the story or create an ending
    
    End with a specific question like: "What does [character] do next?" or "What do they discover?" or "How does the situation unfold?"`,
    
    visualPrompts: (scenes, characters) => scenes.map(scene => ({
      type: 'story_illustration',
      style: 'digital illustration, storytelling art, emotional',
      prompt: `Story illustration: ${scene.description}, featuring ${characters.map(c => c.name).join(' and ')}, emotional storytelling art style`
    }))
  },
  
  comic: {
    name: 'Comic Book',
    prompt: `You are creating a comic book panel by panel. For this input:
    - Describe ONE comic panel only (what we see, dialogue, action)
    - Keep it focused on a single moment or action
    - Include brief dialogue or narration if needed
    - Ask what happens in the next panel
    - DO NOT describe multiple panels or entire pages
    
    Format your response as:
    [PANEL X: Brief description of what's shown]
    [Any dialogue in quotes]
    
    Then ask: "What happens in the next panel?" or "How does [character] respond?"`,
    
    visualPrompts: (scenes, characters) => scenes.map((scene, index) => ({
      type: 'comic_panel',
      style: 'comic book art, vibrant colors, dynamic composition',
      prompt: `Comic book panel: ${scene.description}, ${characters.map(c => c.name).join(', ')}, comic book style, dynamic action, speech bubbles`,
      panelNumber: index + 1,
      characters: characters.filter(c => scene.content.includes(c.name))
    }))
  },
  
  screenplay: {
    name: 'Visual Screenplay',
    prompt: `You are writing a screenplay scene by scene. For this input:
    - Write ONE scene beat or moment in proper screenplay format
    - Focus on visual storytelling and character action
    - Keep it brief (2-3 lines of action maximum)
    - Ask what happens next in the scene
    - DO NOT write entire scenes or multiple scene beats
    
    Format as proper screenplay:
    INT./EXT. LOCATION - TIME
    Brief action line.
    
    End with: "What happens next in this scene?" or "How does [character] respond?"`,
    
    visualPrompts: (scenes) => scenes.map(scene => ({
      type: 'storyboard',
      style: 'storyboard sketch, black and white, professional',
      prompt: `Storyboard panel: ${scene.description}, ${scene.location}, ${scene.timeOfDay}, cinematic composition, storyboard style`
    }))
  },

  // PHASE 3: New visual-first formats - also made iterative
  storyboard: {
    name: 'Complete Storyboard',
    prompt: `You are creating a storyboard frame by frame. For this input:
    - Describe ONE storyboard frame only
    - Include camera angle and shot type for this single frame
    - Add brief timing note for this frame
    - Ask what happens in the next frame
    - DO NOT describe multiple frames or entire sequences
    
    Format as:
    FRAME X: [Shot type] - [Brief description]
    CAMERA: [Angle]
    DURATION: [Time]
    
    Then ask: "What happens in the next frame?"`,
    
    visualPrompts: (scenes) => scenes.map((scene, index) => ({
      type: 'storyboard_panel',
      style: 'professional storyboard, sketch style, production ready',
      prompt: `Storyboard frame ${index + 1}: ${scene.description}, ${scene.location}, camera angle: ${scene.cameraAngle || 'medium shot'}, storyboard sketch style`,
      frameNumber: index + 1,
      shotType: scene.shotType || 'medium',
      duration: scene.duration || '3 seconds'
    }))
  },

  manga: {
    name: 'Manga Style Comic',
    prompt: `You are creating manga panels one at a time. For this input:
    - Describe ONE manga panel with authentic Japanese style
    - Include character expressions and emotions for this single panel
    - Add sound effects if appropriate
    - Ask what happens in the next panel
    - DO NOT describe multiple panels or full pages
    
    Format as:
    [PANEL X: Manga-style description]
    [Sound effects: if any]
    [Character emotions/expressions]
    
    Then ask: "What happens in the next panel?"`,
    
    visualPrompts: (scenes, characters) => scenes.map(scene => ({
      type: 'manga_panel',
      style: 'manga art style, black and white, detailed lineart, authentic Japanese manga',
      prompt: `Manga panel: ${scene.description}, manga art style, detailed character expressions, authentic Japanese comic style`
    }))
  }
};

// NEW: Iterative story continuation endpoint
app.post('/api/continue-story', async (req, res) => {
  const { 
    text, 
    previousContext = '', 
    format = 'story', 
    conversationHistory = [] 
  } = req.body;
  
  console.log(`\n📝 === ITERATIVE STORY CONTINUATION ===`);
  console.log(`Format: ${format}`);
  console.log(`New input: ${text?.substring(0, 100)}...`);
  console.log(`Previous context length: ${previousContext.length}`);
  console.log(`Conversation history length: ${conversationHistory.length}`);
  
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const projectId = uuidv4();
  
  try {
    const result = await continueStoryIteratively(
      text.trim(), 
      previousContext, 
      format, 
      conversationHistory
    );
    
    console.log(`✅ Iterative continuation complete`);
    
    res.json({
      success: true,
      projectId,
      userInput: text,
      continuation: result.continuation,
      fullStory: result.fullStory,
      question: result.question,
      format: format,
      demo: result.demo,
      conversationHistory: result.conversationHistory,
      wordCount: result.continuation.split(' ').length,
      isIterative: true
    });

  } catch (error) {
    console.error('Story continuation error:', error);
    res.status(500).json({ 
      error: 'Failed to continue story',
      details: error.message 
    });
  }
});

// NEW: Function for iterative story development
const continueStoryIteratively = async (newInput, previousContext, format, conversationHistory) => {
  console.log(`📝 Continuing story iteratively for ${format} format...`);
  
  const template = formatTemplates[format] || formatTemplates.story;
  
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') {
    const mockContinuation = `[DEMO] Based on "${newInput.substring(0, 50)}...", the story continues:\n\nThe character paused, considering their next move carefully. The air grew thick with anticipation as they reached for the door handle.\n\nWhat happens when they open the door?`;
    
    return {
      continuation: mockContinuation,
      fullStory: previousContext ? previousContext + '\n\n' + mockContinuation : mockContinuation,
      question: "What happens when they open the door?",
      demo: true,
      conversationHistory: [...conversationHistory, { 
        input: newInput, 
        output: mockContinuation,
        timestamp: new Date().toISOString()
      }]
    };
  }

  try {
    // Build context for the AI
    let contextPrompt;
    
    if (previousContext) {
      contextPrompt = `Previous story so far:\n"${previousContext}"\n\nUser's new input: "${newInput}"\n\nContinue the story with just one paragraph and ask what happens next.`;
    } else {
      contextPrompt = `User's story beginning: "${newInput}"\n\nStart the story with one engaging paragraph and ask what happens next.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{
        role: "system",
        content: template.prompt
      }, {
        role: "user", 
        content: contextPrompt
      }],
      max_tokens: 150, // Reduced to force shorter responses
      temperature: 0.7
    });

    const continuation = completion.choices[0].message.content.trim();
    const fullStory = previousContext ? previousContext + '\n\n' + continuation : continuation;
    
    // Extract question from the response (should be at the end)
    const questionMatch = continuation.match(/([?].*)$/s);
    const question = questionMatch ? questionMatch[0].trim() : "What happens next?";
    
    return {
      continuation,
      fullStory,
      question,
      demo: false,
      usage: completion.usage,
      conversationHistory: [...conversationHistory, { 
        input: newInput, 
        output: continuation,
        timestamp: new Date().toISOString()
      }]
    };

  } catch (error) {
    console.error('Iterative story continuation error:', error);
    throw error;
  }
};

// UPDATED: Modified enhance-story endpoint to use iterative approach by default
app.post('/api/enhance-story', async (req, res) => {
  const { 
    text, 
    format = 'story', 
    characters = [], 
    generateVisuals = false,
    useIterative = true, // NEW: Flag to use iterative mode
    previousContext = '',
    conversationHistory = []
  } = req.body;
  
  console.log(`\n🎭 === STORY ENHANCEMENT ===`);
  console.log(`📝 Text length: ${text?.length || 0} characters`);
  console.log(`📄 Format: ${format}`);
  console.log(`🎨 Generate visuals: ${generateVisuals}`);
  console.log(`🔄 Use iterative: ${useIterative}`);
  
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (text.length > 10000) {
    return res.status(400).json({ error: 'Text too long. Please limit to 10,000 characters.' });
  }

  const projectId = uuidv4();
  
  try {
    let result;
    
    if (useIterative) {
      // Use new iterative approach
      result = await continueStoryIteratively(
        text.trim(), 
        previousContext, 
        format, 
        conversationHistory
      );
      
      res.json({
        success: true,
        projectId,
        original: text,
        enhanced: result.continuation,
        fullStory: result.fullStory,
        question: result.question,
        format: format,
        demo: result.demo,
        usage: result.usage,
        conversationHistory: result.conversationHistory,
        wordCount: result.continuation.split(' ').length,
        isIterative: true
      });
    } else {
      // Use original full enhancement (for backwards compatibility)
      result = generateVisuals 
        ? await enhanceTextWithVisuals(text.trim(), format, { characters })
        : await enhanceText(text.trim(), format, { characters });
      
      // Generate files
      const downloadUrls = await generateFormattedFiles(result, format, projectId);
      
      res.json({
        success: true,
        projectId,
        original: result.original,
        enhanced: result.enhanced,
        format: result.format,
        downloadUrls,
        demo: result.demo,
        usage: result.usage,
        error: result.error,
        visuals: result.visuals,
        hasVisuals: result.hasVisuals,
        characters: result.characters,
        scenes: result.scenes,
        wordCount: result.wordCount,
        isIterative: false,
        metadata: {
          visualsGenerated: result.hasVisuals,
          imagesCreated: result.visuals ? (result.visuals.panels?.length || result.visuals.illustrations?.length || 0) : 0,
          processingTime: Date.now()
        }
      });
    }

    console.log(`✅ Enhancement complete for project ${projectId}`);

  } catch (error) {
    console.error('Enhancement error:', error);
    res.status(500).json({ 
      error: 'Failed to enhance story',
      details: error.message 
    });
  }
});

// NEW: Get conversation history
app.get('/api/conversation/:projectId', async (req, res) => {
  const { projectId } = req.params;
  
  // In a real app, you'd store this in a database
  // For now, return empty array since we're not persisting conversations
  res.json({
    success: true,
    projectId,
    conversationHistory: [],
    message: "Conversation history would be stored in database"
  });
});

// NEW: Reset conversation
app.post('/api/reset-conversation', async (req, res) => {
  const { projectId } = req.body;
  
  // In a real app, you'd clear the conversation from database
  res.json({
    success: true,
    projectId,
    message: "Conversation reset (would clear database in production)"
  });
});

// Rest of your existing code remains the same...
// [Include all your existing VisualGenerator, StoryboardGenerator, ComicPanelGenerator classes]
// [Include all your existing visual generation functions]
// [Include all your existing helper functions]

class VisualGenerator {
  constructor() {
    this.generatedImages = new Map();
    this.characterDesigns = new Map();
  }

  async generateImage(prompt, style = 'realistic', service = 'dalle') {
    console.log(`🎨 Generating image with ${service}: ${prompt}`);
    
    try {
      switch (service) {
        case 'dalle':
          return await this.generateWithDALLE(prompt, style);
        case 'midjourney':
          return await this.generateWithMidjourney(prompt, style);
        case 'stability':
          return await this.generateWithStability(prompt, style);
        default:
          return await this.generateWithDALLE(prompt, style);
      }
    } catch (error) {
      console.error(`Image generation failed with ${service}:`, error);
      return this.generateFallbackImage(prompt, style);
    }
  }

  async generateWithDALLE(prompt, style) {
    if (!VISUAL_CONFIG.services.dalle.enabled) {
      throw new Error('DALL-E not configured');
    }

    const stylePrompt = this.enhancePromptWithStyle(prompt, style);
    
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: stylePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard'
    });

    const imageUrl = response.data[0].url;
    const localPath = await this.downloadAndSaveImage(imageUrl);
    
    return {
      url: imageUrl,
      localPath,
      service: 'dalle',
      prompt: stylePrompt,
      style
    };
  }

  async generateWithMidjourney(prompt, style) {
    console.log('Midjourney generation would happen here');
    return this.generateFallbackImage(prompt, style);
  }

  async generateWithStability(prompt, style) {
    if (!VISUAL_CONFIG.services.stability.enabled) {
      throw new Error('Stability AI not configured');
    }

    const stylePrompt = this.enhancePromptWithStyle(prompt, style);
    
    const response = await axios.post(
      VISUAL_CONFIG.services.stability.endpoint,
      {
        text_prompts: [{ text: stylePrompt }],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 30
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`
        }
      }
    );

    const imageData = response.data.artifacts[0].base64;
    const localPath = await this.saveBase64Image(imageData);
    
    return {
      localPath,
      service: 'stability',
      prompt: stylePrompt,
      style
    };
  }

  enhancePromptWithStyle(prompt, style) {
    const styleEnhancements = {
      'comic': 'comic book art style, vibrant colors, dynamic composition, professional comic illustration',
      'manga': 'manga art style, black and white, detailed lineart, authentic Japanese comic style',
      'storyboard': 'storyboard sketch, professional production art, clear composition, pencil sketch style',
      'realistic': 'photorealistic, high detail, professional photography style',
      'illustration': 'digital illustration, artistic, detailed artwork, professional illustration style',
      'sketch': 'pencil sketch, hand-drawn style, artistic sketch, black and white line art'
    };

    const enhancement = styleEnhancements[style] || styleEnhancements['realistic'];
    return `${prompt}, ${enhancement}`;
  }

  async downloadAndSaveImage(imageUrl) {
    const imageId = uuidv4();
    const imagePath = path.join('generated_images', `${imageId}.png`);
    
    console.log(`📥 Downloading image from: ${imageUrl}`);
    console.log(`💾 Saving to: ${imagePath}`);
    
    await fs.ensureDir('generated_images');
    
    try {
      const response = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(imagePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`✅ Image saved successfully: ${imagePath}`);
          resolve(`/images/${imageId}.png`);
        });
        writer.on('error', (error) => {
          console.error(`❌ Image save failed:`, error);
          reject(error);
        });
      });
    } catch (error) {
      console.error(`❌ Image download failed:`, error);
      throw error;
    }
  }

  async saveBase64Image(base64Data) {
    const imageId = uuidv4();
    const imagePath = path.join('generated_images', `${imageId}.png`);
    
    await fs.ensureDir('generated_images');
    await fs.writeFile(imagePath, base64Data, 'base64');
    
    return `/images/${imageId}.png`;
  }

  generateFallbackImage(prompt, style) {
    return {
      localPath: '/images/placeholder.png',
      service: 'fallback',
      prompt,
      style,
      demo: true,
      description: `[Demo Mode] Would generate: ${style} style image of "${prompt}"`
    };
  }
}

// Initialize visual generation system
const visualGenerator = new VisualGenerator();

// Keep all your existing helper functions
const enhanceTextWithVisuals = async (rawText, format = 'book', options = {}) => {
  console.log(`🎨 Phase 3: Enhancing text with visuals for ${format} format...`);
  
  const textResult = await enhanceText(rawText, format, options);
  
  const scenes = extractScenes(textResult.enhanced);
  const characters = extractCharacters(textResult.enhanced);
  
  let visualContent = null;
  
  try {
    switch (format) {
      case 'book':
      case 'story':
        const keyScenes = scenes.slice(0, Math.min(3, scenes.length));
        const illustrations = [];
        
        for (const scene of keyScenes) {
          const image = await visualGenerator.generateImage(
            `Book illustration: ${scene.description}`,
            'illustration'
          );
          illustrations.push({ scene, image });
        }
        
        visualContent = { illustrations, type: 'book_illustrations' };
        break;
        
      default:
        console.log(`No visual generation for format: ${format}`);
    }
    
  } catch (error) {
    console.error('Visual generation failed:', error);
    visualContent = { error: error.message, demo: true };
  }
  
  return {
    ...textResult,
    visuals: visualContent,
    hasVisuals: !!visualContent && !visualContent.error
  };
};

const enhanceText = async (rawText, format = 'book', options = {}) => {
  console.log(`📝 Processing text for ${format} format...`);
  
  const template = formatTemplates[format] || formatTemplates.book;
  
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') {
    return {
      original: rawText,
      enhanced: formatDemoText(rawText, format),
      format: format,
      demo: true,
      characters: extractCharacters(rawText),
      scenes: extractScenes(rawText)
    };
  }

  try {
    let enhancedPrompt = template.prompt;
    
    if (options.characters && options.characters.length > 0) {
      enhancedPrompt += `\n\nCharacter consistency: ${options.characters.map(c => `${c.name}: ${c.description}`).join(', ')}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{
        role: "system",
        content: enhancedPrompt
      }, {
        role: "user", 
        content: rawText
      }],
      max_tokens: 3000,
      temperature: 0.7
    });

    const enhancedText = completion.choices[0].message.content;
    
    return {
      original: rawText,
      enhanced: enhancedText,
      format: format,
      demo: false,
      usage: completion.usage,
      characters: extractCharacters(enhancedText),
      scenes: extractScenes(enhancedText),
      wordCount: enhancedText.split(' ').length
    };

  } catch (error) {
    console.error('Text enhancement error:', error);
    return {
      original: rawText,
      enhanced: formatDemoText(rawText, format),
      format: format,
      demo: true,
      error: error.message,
      characters: extractCharacters(rawText),
      scenes: extractScenes(rawText)
    };
  }
};

function extractCharacters(text) {
  const characters = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    const dialogueMatch = line.match(/^([A-Z][A-Z\s]+):\s*(.+)/);
    if (dialogueMatch) {
      const name = dialogueMatch[1].trim();
      if (!characters.find(c => c.name === name)) {
        characters.push({
          name,
          type: 'speaker',
          firstAppearance: line
        });
      }
    }
  });
  
  return characters;
}

function extractScenes(text) {
  const scenes = [];
  const sections = text.split(/\n\s*\n/);
  
  sections.forEach((section, index) => {
    if (section.trim()) {
      const locationMatch = section.match(/(INT\.|EXT\.|INTERIOR|EXTERIOR)\s+([^-\n]+)(?:\s*-\s*(.+))?/i);
      const timeMatch = section.match(/(MORNING|AFTERNOON|EVENING|NIGHT|DAY|DAWN|DUSK)/i);
      
      scenes.push({
        id: index + 1,
        title: `Scene ${index + 1}`,
        content: section.trim(),
        description: section.substring(0, 200).trim(),
        location: locationMatch ? locationMatch[2].trim() : 'Unknown',
        timeOfDay: timeMatch ? timeMatch[1].toLowerCase() : 'unspecified',
        wordCount: section.split(' ').length
      });
    }
  });
  
  return scenes;
}

function formatDemoText(text, format) {
  const template = formatTemplates[format];
  if (!template) return text;
  
  return `[DEMO MODE - ${template.name}]\n\n${text}\n\n[AI would continue with one paragraph and ask what happens next]`;
}

const generateFormattedFiles = async (result, format, projectId) => {
  const outputPath = `outputs/${projectId}`;
  await fs.ensureDir(outputPath);
  
  const files = {};
  const timestamp = Date.now();
  
  const textPath = path.join(outputPath, `story-${format}-${timestamp}.txt`);
  await fs.writeFile(textPath, result.enhanced);
  files.txt = `/outputs/${projectId}/story-${format}-${timestamp}.txt`;
  
  const htmlContent = generateVisualHTML(result, format, projectId);
  const htmlPath = path.join(outputPath, `story-${format}-${timestamp}.html`);
  await fs.writeFile(htmlPath, htmlContent);
  files.html = `/outputs/${projectId}/story-${format}-${timestamp}.html`;
  
  return files;
};

function generateVisualHTML(result, format, projectId) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AuraMythos ${format.charAt(0).toUpperCase() + format.slice(1)} Story</title>
    </head>
    <body>
      <div class="header">
        <h1>Your ${format.charAt(0).toUpperCase() + format.slice(1)} Story</h1>
        <p class="subtitle">Enhanced with AI • Generated by AuraMythos</p>
      </div>
      
      <div class="content">
        <div class="text-content">
          ${result.enhanced.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}
        </div>
      </div>
      
      <div class="footer">
        <p>Created with AuraMythos AI Story Enhancement</p>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
      </div>
    </body>
    </html>
  `;
}

// Health check with iterative info
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AuraMythos.ai - Iterative Story Development',
    features: [
      'Iterative paragraph-by-paragraph story development',
      'AI asks for context instead of generating long stories',
      'Collaborative storytelling approach',
      'Multiple story formats supported',
      'Visual generation capabilities'
    ],
    hasOpenAI: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here',
    formats: Object.keys(formatTemplates),
    iterativeMode: true
  });
});

app.get('/api/formats', (req, res) => {
  const formats = Object.keys(formatTemplates).map(key => ({
    id: key,
    name: formatTemplates[key].name,
    description: 'Iterative development - one paragraph at a time',
    iterative: true
  }));
  
  res.json({ 
    formats,
    iterativeMode: true,
    message: 'All formats now support iterative development'
  });
});

// Create required directories
const dirs = ['uploads', 'outputs', 'generated_images'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.listen(PORT, () => {
  console.log(`\n🎨 AuraMythos Iterative Server running on http://localhost:${PORT}`);
  console.log(`📁 Output directory: ${path.resolve('outputs')}`);
  console.log(`🖼️  Images directory: ${path.resolve('generated_images')}`);
  
  console.log(`\n🤖 AI Services Status:`);
  console.log(`   ${VISUAL_CONFIG.services.dalle.enabled ? '✅' : '❌'} DALL-E 3 (OpenAI)`);
  
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') {
    console.log(`\n⚠️  Demo Mode: Add OPENAI_API_KEY to .env file for full functionality`);
  } else {
    console.log(`\n🎨 AI Enhanced: Ready for iterative story development`);
  }
  
  console.log(`\n🚀 NEW Iterative Features Active:`);
  console.log(`   ✅ Paragraph-by-paragraph story development`);
  console.log(`   ✅ AI asks for context instead of generating long stories`);
  console.log(`   ✅ Collaborative storytelling approach`);
  console.log(`   ✅ All formats support iterative mode`);
  console.log(`   ✅ Conversation history tracking`);
  
  console.log(`\n📚 Available Formats: ${Object.keys(formatTemplates).join(', ')}`);
  console.log(`🔄 Mode: Iterative (short responses + questions)`);
});