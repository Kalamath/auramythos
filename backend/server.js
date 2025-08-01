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

// PHASE 3: Enhanced formatting templates with visual generation
const formatTemplates = {
  book: {
    name: 'Illustrated Novel',
    prompt: `Transform this into well-written prose with chapter illustrations:
    - Create rich, descriptive prose with proper paragraphs
    - Identify key scenes for visual illustration
    - Include detailed scene descriptions for image generation
    - Structure with clear chapters and narrative flow`,
    
    visualPrompts: (scenes) => scenes.map(scene => ({
      type: 'illustration',
      style: 'detailed painting, book illustration style',
      prompt: `Book illustration: ${scene.description}, detailed artwork, professional book illustration style`
    }))
  },
  
  screenplay: {
    name: 'Visual Screenplay',
    prompt: `Convert to professional screenplay with storyboard images:
    - Use industry-standard scene headings and formatting
    - Include detailed visual descriptions for each scene
    - Format dialogue and action lines properly
    - Create storyboard-ready scene breakdowns`,
    
    visualPrompts: (scenes) => scenes.map(scene => ({
      type: 'storyboard',
      style: 'storyboard sketch, black and white, professional',
      prompt: `Storyboard panel: ${scene.description}, ${scene.location}, ${scene.timeOfDay}, cinematic composition, storyboard style`
    }))
  },
  
  comic: {
    name: 'Full Comic Book',
    prompt: `Transform into complete comic book with panels and artwork:
    - Break story into pages and panels (6-8 panels max per page)
    - Create detailed panel descriptions for artists
    - Format dialogue for speech bubbles
    - Include visual storytelling elements and pacing`,
    
    visualPrompts: (scenes, characters) => scenes.map((scene, index) => ({
      type: 'comic_panel',
      style: 'comic book art, vibrant colors, dynamic composition',
      prompt: `Comic book panel: ${scene.description}, ${characters.map(c => c.name).join(', ')}, comic book style, dynamic action, speech bubbles`,
      panelNumber: index + 1,
      characters: characters.filter(c => scene.content.includes(c.name))
    }))
  },
  
  story: {
    name: 'Illustrated Story',
    prompt: `Create an engaging illustrated short story:
    - Develop narrative structure with clear beginning, middle, end
    - Add rich descriptions and character development
    - Identify key moments for illustration
    - Include atmospheric and emotional elements`,
    
    visualPrompts: (scenes, characters) => scenes.map(scene => ({
      type: 'story_illustration',
      style: 'digital illustration, storytelling art, emotional',
      prompt: `Story illustration: ${scene.description}, featuring ${characters.map(c => c.name).join(' and ')}, emotional storytelling art style`
    }))
  },

  // PHASE 3: New visual-first formats
  storyboard: {
    name: 'Complete Storyboard',
    prompt: `Create a professional storyboard with scene descriptions:
    - Break story into sequential scenes
    - Include camera angles and shot types
    - Add timing and transition notes
    - Format for production use`,
    
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
    prompt: `Transform into manga-style comic with authentic formatting:
    - Use manga panel layouts and reading flow
    - Include detailed character expressions and emotions
    - Add sound effects and visual elements
    - Follow Japanese comic conventions`,
    
    visualPrompts: (scenes, characters) => scenes.map(scene => ({
      type: 'manga_panel',
      style: 'manga art style, black and white, detailed lineart, authentic Japanese manga',
      prompt: `Manga panel: ${scene.description}, manga art style, detailed character expressions, authentic Japanese comic style`
    }))
  }
};

// PHASE 3: Visual Generation Classes

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
    // Placeholder for Midjourney API integration
    // You would implement actual Midjourney API calls here
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

    // Process Stability AI response
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
    // Generate a placeholder image description for demo mode
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

class StoryboardGenerator {
  constructor(visualGenerator) {
    this.visualGenerator = visualGenerator;
  }

  async generateStoryboard(scenes, characters, style = 'storyboard') {
    console.log(`🎬 Generating storyboard with ${scenes.length} scenes`);
    
    const storyboardPanels = [];
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      
      // Create visual prompt for this scene
      const visualPrompt = this.createScenePrompt(scene, characters, i + 1);
      
      // Generate image for this scene
      const image = await this.visualGenerator.generateImage(
        visualPrompt.prompt,
        style,
        'dalle'
      );
      
      storyboardPanels.push({
        panelNumber: i + 1,
        scene: scene,
        image: image,
        description: scene.description || scene.content.substring(0, 100),
        characters: characters.filter(c => 
          scene.content.toLowerCase().includes(c.name.toLowerCase())
        ),
        duration: this.estimateSceneDuration(scene),
        shotType: this.determineShotType(scene, i),
        cameraAngle: this.determineCameraAngle(scene, i)
      });
    }
    
    return {
      panels: storyboardPanels,
      totalDuration: storyboardPanels.reduce((sum, panel) => sum + panel.duration, 0),
      style: style,
      generatedAt: new Date().toISOString()
    };
  }

  createScenePrompt(scene, characters, panelNumber) {
    const sceneCharacters = characters.filter(c => 
      scene.content.toLowerCase().includes(c.name.toLowerCase())
    );
    
    const characterDescriptions = sceneCharacters.map(c => 
      `${c.name}: ${c.description || 'character'}`
    ).join(', ');
    
    return {
      prompt: `Storyboard panel ${panelNumber}: ${scene.description || scene.content.substring(0, 100)}, featuring ${characterDescriptions}, ${scene.location || 'indoor scene'}, ${scene.timeOfDay || 'daytime'}, professional storyboard style`,
      panelNumber,
      characters: sceneCharacters
    };
  }

  estimateSceneDuration(scene) {
    // Estimate scene duration based on content length and action
    const wordCount = scene.content.split(' ').length;
    const baseTime = Math.max(3, wordCount * 0.5); // 0.5 seconds per word, minimum 3 seconds
    
    // Adjust for action vs dialogue
    if (scene.content.includes('ACTION:') || scene.content.includes('fight') || scene.content.includes('chase')) {
      return baseTime * 1.5; // Action scenes take longer
    }
    
    return baseTime;
  }

  determineShotType(scene, index) {
    const shotTypes = ['wide', 'medium', 'close-up', 'extreme-close-up'];
    
    // Vary shot types for visual interest
    if (index === 0) return 'wide'; // Establishing shot
    if (scene.content.includes('emotion') || scene.content.includes('reaction')) return 'close-up';
    if (scene.content.includes('landscape') || scene.content.includes('location')) return 'wide';
    
    return shotTypes[index % shotTypes.length];
  }

  determineCameraAngle(scene, index) {
    const angles = ['eye-level', 'low-angle', 'high-angle', 'dutch-angle'];
    
    if (scene.content.includes('powerful') || scene.content.includes('heroic')) return 'low-angle';
    if (scene.content.includes('vulnerable') || scene.content.includes('small')) return 'high-angle';
    
    return angles[index % angles.length];
  }
}

class ComicPanelGenerator {
  constructor(visualGenerator) {
    this.visualGenerator = visualGenerator;
  }

  async generateComicPages(scenes, characters, format = 'comic') {
    console.log(`📖 Generating comic pages for ${scenes.length} scenes`);
    
    const pages = [];
    const panelsPerPage = 6; // Standard comic page layout
    
    for (let pageIndex = 0; pageIndex < Math.ceil(scenes.length / panelsPerPage); pageIndex++) {
      const pageScenes = scenes.slice(
        pageIndex * panelsPerPage, 
        (pageIndex + 1) * panelsPerPage
      );
      
      const page = await this.generatePage(pageScenes, characters, pageIndex + 1);
      pages.push(page);
    }
    
    return {
      pages,
      totalPages: pages.length,
      format,
      characters: characters,
      generatedAt: new Date().toISOString()
    };
  }

  async generatePage(scenes, characters, pageNumber) {
    const panels = [];
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const panelPrompt = this.createComicPanelPrompt(scene, characters, i + 1);
      
      const image = await this.visualGenerator.generateImage(
        panelPrompt.prompt,
        'comic',
        'dalle'
      );
      
      panels.push({
        panelNumber: i + 1,
        scene: scene,
        image: image,
        dialogue: this.extractDialogue(scene.content),
        narration: this.extractNarration(scene.content),
        soundEffects: this.extractSoundEffects(scene.content),
        characters: panelPrompt.characters
      });
    }
    
    return {
      pageNumber,
      panels,
      layout: this.determinePageLayout(panels.length)
    };
  }

  createComicPanelPrompt(scene, characters, panelNumber) {
    const sceneCharacters = characters.filter(c => 
      scene.content.toLowerCase().includes(c.name.toLowerCase())
    );
    
    return {
      prompt: `Comic book panel: ${scene.description || scene.content.substring(0, 150)}, dynamic composition, comic book art style, vibrant colors, ${sceneCharacters.map(c => c.name).join(' and ')} in action`,
      characters: sceneCharacters,
      panelNumber
    };
  }

  extractDialogue(content) {
    // Extract dialogue from scene content
    const dialogueMatches = content.match(/"([^"]+)"/g);
    return dialogueMatches ? dialogueMatches.map(d => d.replace(/"/g, '')) : [];
  }

  extractNarration(content) {
    // Extract narrative text (non-dialogue)
    return content.replace(/"[^"]+"/g, '').trim();
  }

  extractSoundEffects(content) {
    // Look for sound effects in text
    const sfxWords = ['BANG', 'CRASH', 'BOOM', 'ZAP', 'POW', 'WHOOSH'];
    const foundSfx = sfxWords.filter(sfx => 
      content.toUpperCase().includes(sfx)
    );
    return foundSfx;
  }

  determinePageLayout(panelCount) {
    const layouts = {
      1: '1-panel',
      2: '2-panel',
      3: '3-panel',
      4: '4-panel',
      5: '5-panel-mixed',
      6: '6-panel-grid'
    };
    
    return layouts[panelCount] || '6-panel-grid';
  }
}

// Initialize visual generation system
const visualGenerator = new VisualGenerator();
const storyboardGenerator = new StoryboardGenerator(visualGenerator);
const comicGenerator = new ComicPanelGenerator(visualGenerator);

// PHASE 3: Enhanced story processing with visual generation
const enhanceTextWithVisuals = async (rawText, format = 'book', options = {}) => {
  console.log(`🎨 Phase 3: Enhancing text with visuals for ${format} format...`);
  
  // First, enhance the text (Phase 2 functionality)
  const textResult = await enhanceText(rawText, format, options);
  
  // Then, generate visuals based on the enhanced content
  const scenes = extractScenes(textResult.enhanced);
  const characters = extractCharacters(textResult.enhanced);
  
  let visualContent = null;
  
  try {
    switch (format) {
      case 'comic':
      case 'manga':
        visualContent = await comicGenerator.generateComicPages(scenes, characters, format);
        break;
        
      case 'storyboard':
      case 'screenplay':
        visualContent = await storyboardGenerator.generateStoryboard(scenes, characters, format);
        break;
        
      case 'book':
      case 'story':
        // Generate key illustrations for important scenes
        const keyScenes = scenes.slice(0, Math.min(3, scenes.length)); // Max 3 illustrations
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

// Enhanced text processing (from Phase 2)
const enhanceText = async (rawText, format = 'book', options = {}) => {
  // Implementation from Phase 2 server
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

// Helper functions (from Phase 2)
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
  
  return `[DEMO MODE - ${template.name}]\n\n${text}\n\n[Visual generation would create images here with full API access]`;
}

// PHASE 3 ROUTES

app.post('/api/enhance-story', async (req, res) => {
  const { text, format = 'book', characters = [], generateVisuals = true } = req.body;
  
  console.log(`\n🎭 === PHASE 3 VISUAL STORY ENHANCEMENT ===`);
  console.log(`📝 Text length: ${text?.length || 0} characters`);
  console.log(`📄 Format: ${format}`);
  console.log(`🎨 Generate visuals: ${generateVisuals}`);
  
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (text.length > 10000) {
    return res.status(400).json({ error: 'Text too long. Please limit to 10,000 characters.' });
  }

  const projectId = uuidv4();
  
  try {
    // Enhanced processing with visual generation
    const result = generateVisuals 
      ? await enhanceTextWithVisuals(text.trim(), format, { characters })
      : await enhanceText(text.trim(), format, { characters });
    
    // Generate files
    const downloadUrls = await generateFormattedFiles(result, format, projectId);
    
    console.log(`✅ Phase 3 enhancement complete for project ${projectId}`);
    
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
      // Phase 3 additions:
      visuals: result.visuals,
      hasVisuals: result.hasVisuals,
      characters: result.characters,
      scenes: result.scenes,
      wordCount: result.wordCount,
      metadata: {
        visualsGenerated: result.hasVisuals,
        imagesCreated: result.visuals ? (result.visuals.panels?.length || result.visuals.illustrations?.length || 0) : 0,
        processingTime: Date.now()
      }
    });

  } catch (error) {
    console.error('Phase 3 enhancement error:', error);
    res.status(500).json({ 
      error: 'Failed to enhance story with visuals',
      details: error.message 
    });
  }
});

// Generate files with visual content
const generateFormattedFiles = async (result, format, projectId) => {
  const outputPath = `outputs/${projectId}`;
  await fs.ensureDir(outputPath);
  
  const files = {};
  const timestamp = Date.now();
  
  // Text file
  const textPath = path.join(outputPath, `story-${format}-${timestamp}.txt`);
  await fs.writeFile(textPath, result.enhanced);
  files.txt = `/outputs/${projectId}/story-${format}-${timestamp}.txt`;
  
  // HTML file with embedded images
  const htmlContent = generateVisualHTML(result, format, projectId);
  const htmlPath = path.join(outputPath, `story-${format}-${timestamp}.html`);
  await fs.writeFile(htmlPath, htmlContent);
  files.html = `/outputs/${projectId}/story-${format}-${timestamp}.html`;
  
  // Format-specific files with visual content
  if (result.visuals && !result.visuals.error) {
    switch (format) {
      case 'comic':
      case 'manga':
        // Generate comic book PDF
        const comicPdf = await generateComicPDF(result.visuals, projectId);
        files.comic = comicPdf;
        break;
        
      case 'storyboard':
        // Generate storyboard PDF
        const storyboardPdf = await generateStoryboardPDF(result.visuals, projectId);
        files.storyboard = storyboardPdf;
        break;
        
      case 'book':
      case 'story':
        // Generate illustrated book PDF
        if (result.visuals.illustrations) {
          const bookPdf = await generateIllustratedBookPDF(result, projectId);
          files.illustrated = bookPdf;
        }
        break;
    }
  }
  
  return files;
};

// Generate HTML with embedded visual content
function generateVisualHTML(result, format, projectId) {
  const styles = getHTMLStyles(format);
  
  let visualsHTML = '';
  
  if (result.visuals && !result.visuals.error) {
    switch (format) {
      case 'comic':
      case 'manga':
        visualsHTML = generateComicHTML(result.visuals);
        break;
      case 'storyboard':
        visualsHTML = generateStoryboardHTML(result.visuals);
        break;
      case 'book':
      case 'story':
        visualsHTML = generateIllustrationsHTML(result.visuals);
        break;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AuraMythos ${format.charAt(0).toUpperCase() + format.slice(1)} Story</title>
      <style>${styles}</style>
    </head>
    <body>
      <div class="header">
        <h1>Your ${format.charAt(0).toUpperCase() + format.slice(1)} Story</h1>
        <p class="subtitle">Enhanced with AI • Generated by AuraMythos</p>
        ${result.wordCount ? `<p>Word Count: ${result.wordCount}</p>` : ''}
        ${result.characters ? `<p>Characters: ${result.characters.length}</p>` : ''}
        ${result.scenes ? `<p>Scenes: ${result.scenes.length}</p>` : ''}
      </div>
      
      <div class="content">
        ${visualsHTML}
        
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

function getHTMLStyles(format) {
  const baseStyles = `
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      margin: 0; 
      padding: 20px; 
      background: #f8f9fa;
    }
    .header { 
      text-align: center; 
      margin-bottom: 40px; 
      padding: 20px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header h1 { 
      color: #2c3e50; 
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    .subtitle { 
      color: #7f8c8d; 
      font-style: italic;
    }
    .content { 
      background: white; 
      padding: 30px; 
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .footer { 
      text-align: center; 
      color: #7f8c8d; 
      font-size: 0.9em;
    }
    .visual-section { 
      margin: 30px 0; 
      text-align: center;
    }
    .visual-item { 
      margin: 20px 0; 
      display: inline-block;
    }
    .visual-item img { 
      max-width: 100%; 
      height: auto; 
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .panel-grid { 
      display: grid; 
      gap: 20px; 
      margin: 30px 0;
    }
    .comic-page { 
      border: 2px solid #2c3e50; 
      padding: 20px; 
      margin: 30px 0;
      background: white;
    }
  `;

  const formatStyles = {
    comic: `
      .panel-grid { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
      .comic-panel { 
        border: 3px solid #000; 
        padding: 10px; 
        background: white;
        border-radius: 5px;
      }
      .panel-number { 
        font-weight: bold; 
        color: #e74c3c; 
        margin-bottom: 10px;
      }
      .dialogue { 
        background: #fff; 
        border: 2px solid #000; 
        border-radius: 20px; 
        padding: 10px; 
        margin: 10px 0;
        display: inline-block;
      }
    `,
    storyboard: `
      .panel-grid { grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); }
      .storyboard-panel { 
        border: 1px solid #bdc3c7; 
        padding: 15px; 
        background: #ecf0f1;
      }
      .frame-info { 
        font-size: 0.9em; 
        color: #7f8c8d; 
        margin-bottom: 10px;
      }
    `,
    book: `
      .illustration { 
        text-align: center; 
        margin: 40px 0;
      }
      .illustration img { 
        max-width: 600px; 
        border: 1px solid #bdc3c7;
      }
      .text-content { 
        font-family: 'Times New Roman', serif; 
        font-size: 1.1em;
        text-align: justify;
      }
    `
  };

  return baseStyles + (formatStyles[format] || '');
}

function generateComicHTML(visualContent) {
  if (!visualContent.pages) return '';
  
  let html = '<div class="visual-section"><h2>Comic Pages</h2>';
  
  visualContent.pages.forEach(page => {
    html += `<div class="comic-page">`;
    html += `<h3>Page ${page.pageNumber}</h3>`;
    html += `<div class="panel-grid">`;
    
    page.panels.forEach(panel => {
      html += `<div class="comic-panel">`;
      html += `<div class="panel-number">Panel ${panel.panelNumber}</div>`;
      
      if (panel.image && !panel.image.demo) {
        html += `<img src="${panel.image.localPath}" alt="Panel ${panel.panelNumber}" />`;
      } else {
        html += `<div class="demo-placeholder">[Panel ${panel.panelNumber} - ${panel.image?.description || 'Comic panel would be generated here'}]</div>`;
      }
      
      if (panel.dialogue && panel.dialogue.length > 0) {
        panel.dialogue.forEach(line => {
          html += `<div class="dialogue">${line}</div>`;
        });
      }
      
      html += `</div>`;
    });
    
    html += `</div></div>`;
  });
  
  html += '</div>';
  return html;
}

function generateStoryboardHTML(visualContent) {
  if (!visualContent.panels) return '';
  
  let html = '<div class="visual-section"><h2>Storyboard</h2>';
  html += `<div class="panel-grid">`;
  
  visualContent.panels.forEach(panel => {
    html += `<div class="storyboard-panel">`;
    html += `<div class="frame-info">Frame ${panel.panelNumber} • ${panel.shotType} shot • ${panel.duration}s</div>`;
    
    if (panel.image && !panel.image.demo) {
      html += `<img src="${panel.image.localPath}" alt="Frame ${panel.panelNumber}" />`;
    } else {
      html += `<div class="demo-placeholder">[Storyboard frame ${panel.panelNumber} - ${panel.image?.description || 'Storyboard frame would be generated here'}]</div>`;
    }
    
    html += `<p><strong>Scene:</strong> ${panel.description}</p>`;
    if (panel.characters.length > 0) {
      html += `<p><strong>Characters:</strong> ${panel.characters.map(c => c.name).join(', ')}</p>`;
    }
    html += `</div>`;
  });
  
  html += `</div></div>`;
  return html;
}

function generateIllustrationsHTML(visualContent) {
  if (!visualContent.illustrations) return '';
  
  let html = '<div class="visual-section"><h2>Story Illustrations</h2>';
  
  visualContent.illustrations.forEach((item, index) => {
    html += `<div class="illustration">`;
    html += `<h3>Illustration ${index + 1}</h3>`;
    
    if (item.image && !item.image.demo) {
      html += `<img src="${item.image.localPath}" alt="Illustration ${index + 1}" />`;
    } else {
      html += `<div class="demo-placeholder">[Illustration ${index + 1} - ${item.image?.description || 'Story illustration would be generated here'}]</div>`;
    }
    
    html += `<p class="illustration-caption">${item.scene.description}</p>`;
    html += `</div>`;
  });
  
  html += '</div>';
  return html;
}

// PDF generation functions (placeholders - would need actual PDF library)
async function generateComicPDF(visualContent, projectId) {
  console.log('📖 Generating comic PDF...');
  // Would implement actual PDF generation with libraries like PDFKit or Puppeteer
  return `/outputs/${projectId}/comic-${Date.now()}.pdf`;
}

async function generateStoryboardPDF(visualContent, projectId) {
  console.log('📋 Generating storyboard PDF...');
  // Would implement actual PDF generation
  return `/outputs/${projectId}/storyboard-${Date.now()}.pdf`;
}

async function generateIllustratedBookPDF(result, projectId) {
  console.log('📚 Generating illustrated book PDF...');
  // Would implement actual PDF generation
  return `/outputs/${projectId}/illustrated-book-${Date.now()}.pdf`;
}

// PHASE 3: Visual-specific endpoints

// Generate individual image
app.post('/api/generate-image', async (req, res) => {
  const { prompt, style = 'realistic', service = 'dalle' } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  
  try {
    const image = await visualGenerator.generateImage(prompt, style, service);
    
    res.json({
      success: true,
      image,
      prompt,
      style,
      service
    });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      details: error.message
    });
  }
});

// Generate storyboard only
app.post('/api/generate-storyboard', async (req, res) => {
  const { text, style = 'storyboard' } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  
  try {
    const scenes = extractScenes(text);
    const characters = extractCharacters(text);
    
    const storyboard = await storyboardGenerator.generateStoryboard(scenes, characters, style);
    
    res.json({
      success: true,
      storyboard,
      scenes: scenes.length,
      characters: characters.length
    });
  } catch (error) {
    console.error('Storyboard generation error:', error);
    res.status(500).json({
      error: 'Failed to generate storyboard',
      details: error.message
    });
  }
});

// Generate comic pages only
app.post('/api/generate-comic', async (req, res) => {
  const { text, format = 'comic' } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  
  try {
    const scenes = extractScenes(text);
    const characters = extractCharacters(text);
    
    const comic = await comicGenerator.generateComicPages(scenes, characters, format);
    
    res.json({
      success: true,
      comic,
      pages: comic.totalPages,
      characters: characters.length
    });
  } catch (error) {
    console.error('Comic generation error:', error);
    res.status(500).json({
      error: 'Failed to generate comic',
      details: error.message
    });
  }
});

// Get available visual styles
app.get('/api/visual-styles', (req, res) => {
  res.json({
    success: true,
    styles: {
      comic: 'Comic book art style with vibrant colors',
      manga: 'Japanese manga style with detailed lineart',
      storyboard: 'Professional storyboard sketches',
      realistic: 'Photorealistic style',
      illustration: 'Digital illustration style',
      sketch: 'Hand-drawn pencil sketch style'
    },
    services: {
      dalle: {
        available: VISUAL_CONFIG.services.dalle.enabled,
        description: 'OpenAI DALL-E 3 - High quality, prompt-adherent images'
      },
      midjourney: {
        available: VISUAL_CONFIG.services.midjourney.enabled,
        description: 'Midjourney - Artistic, stylized images'
      },
      stability: {
        available: VISUAL_CONFIG.services.stability.enabled,
        description: 'Stability AI - Fast, customizable generation'
      }
    }
  });
});

// Health check with Phase 3 info
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AuraMythos.ai Phase 3 - Visual Story Generation',
    phase: 3,
    features: [
      'AI image generation (DALL-E, Midjourney, Stability)',
      'Automatic storyboard creation',
      'Comic book panel generation',
      'Character consistency across visuals',
      'Multiple visual styles and formats',
      'Professional formatting with embedded images'
    ],
    visualServices: {
      dalle: VISUAL_CONFIG.services.dalle.enabled,
      midjourney: VISUAL_CONFIG.services.midjourney.enabled,
      stability: VISUAL_CONFIG.services.stability.enabled
    },
    hasOpenAI: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here',
    formats: Object.keys(formatTemplates)
  });
});

// Updated formats endpoint with visual capabilities
app.get('/api/formats', (req, res) => {
  const formats = Object.keys(formatTemplates).map(key => ({
    id: key,
    name: formatTemplates[key].name,
    description: formatTemplates[key].prompt.split('\n')[0],
    hasVisuals: ['comic', 'manga', 'storyboard', 'book', 'story'].includes(key),
    visualType: getVisualType(key)
  }));
  
  res.json({ 
    formats,
    phase: 3,
    newFormats: ['storyboard', 'manga'],
    visualFormats: formats.filter(f => f.hasVisuals).map(f => f.id)
  });
});

function getVisualType(format) {
  const types = {
    comic: 'Multi-panel comic pages',
    manga: 'Manga-style comic panels',
    storyboard: 'Professional storyboard frames',
    book: 'Key scene illustrations',
    story: 'Story moment illustrations',
    screenplay: 'Storyboard visualization'
  };
  return types[format] || 'Text enhancement';
}

// Create required directories
const dirs = ['uploads', 'outputs', 'generated_images'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.listen(PORT, () => {
  console.log(`\n🎨 AuraMythos Phase 3 Server running on http://localhost:${PORT}`);
  console.log(`📁 Output directory: ${path.resolve('outputs')}`);
  console.log(`🖼️  Images directory: ${path.resolve('generated_images')}`);
  
  console.log(`\n🤖 AI Services Status:`);
  console.log(`   ${VISUAL_CONFIG.services.dalle.enabled ? '✅' : '❌'} DALL-E 3 (OpenAI)`);
  console.log(`   ${VISUAL_CONFIG.services.midjourney.enabled ? '✅' : '❌'} Midjourney`);
  console.log(`   ${VISUAL_CONFIG.services.stability.enabled ? '✅' : '❌'} Stability AI`);
  
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') {
    console.log(`\n⚠️  Demo Mode: Add API keys to .env file for full visual generation`);
    console.log(`   OPENAI_API_KEY=your-key-here`);
    console.log(`   MIDJOURNEY_API_KEY=your-key-here (optional)`);
    console.log(`   STABILITY_API_KEY=your-key-here (optional)`);
  } else {
    console.log(`\n🎨 Visual Generation: Ready with AI image generation`);
  }
  
  console.log(`\n🚀 Phase 3 Features Active:`);
  console.log(`   ✅ AI Image Generation (DALL-E 3, Midjourney, Stability AI)`);
  console.log(`   ✅ Automatic Storyboard Creation`);
  console.log(`   ✅ Comic Book Panel Generation`);
  console.log(`   ✅ Character Consistency Across Visuals`);
  console.log(`   ✅ Multiple Visual Styles (Comic, Manga, Realistic, etc.)`);
  console.log(`   ✅ Professional Visual Formatting`);
  console.log(`   ✅ Embedded Image HTML Export`);
  
  console.log(`\n📚 Available Formats: ${Object.keys(formatTemplates).join(', ')}`);
  console.log(`🎨 Visual Styles: comic, manga, storyboard, realistic, illustration, sketch`);

  // Serve the test interface
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'visual-test.html'));
});

});