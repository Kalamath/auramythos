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

// ============================================================================
// ENHANCED LOGGING SYSTEM FOR SERVER
// ============================================================================
const logger = {
  isDev: process.env.NODE_ENV === 'development',
  
  debug: (...args) => {
    if (logger.isDev) console.log('🔍 [DEBUG]', new Date().toISOString(), ...args);
  },
  
  info: (...args) => {
    if (logger.isDev) console.info('ℹ️ [INFO]', new Date().toISOString(), ...args);
  },
  
  warn: (...args) => {
    console.warn('⚠️ [WARN]', new Date().toISOString(), ...args);
  },
  
  error: (...args) => {
    console.error('❌ [ERROR]', new Date().toISOString(), ...args);
  },
  
  success: (...args) => {
    if (logger.isDev) console.log('✅ [SUCCESS]', new Date().toISOString(), ...args);
  },
  
  // API request tracking
  apiRequest: (endpoint, method, body = {}) => {
    if (logger.isDev) {
      console.log('🌐 [API REQUEST]', {
        endpoint,
        method,
        timestamp: new Date().toISOString(),
        bodyKeys: Object.keys(body)
      });
    }
  },
  
  // User action tracking
  userAction: (action, data = {}) => {
    if (logger.isDev) {
      console.log('👤 [USER ACTION]', action, {
        ...data,
        timestamp: new Date().toISOString()
      });
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
  },
  
  // AI service monitoring
  aiService: (service, action, data = {}) => {
    if (logger.isDev) {
      console.log(`🤖 [AI ${service.toUpperCase()}]`, action, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  // Database operations (for future use)
  database: (operation, collection, data = {}) => {
    if (logger.isDev) {
      console.log('💾 [DATABASE]', operation, collection, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }
};

// ============================================================================
// REQUEST LOGGING MIDDLEWARE
// ============================================================================
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, url, body, query, params } = req;
  
  logger.apiRequest(url, method, body);
  
  // Log response when finished
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    if (statusCode >= 400) {
      logger.error('API Response Error:', {
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        error: typeof data === 'string' ? data : JSON.stringify(data).substring(0, 200)
      });
    } else {
      logger.success('API Response Success:', {
        method,
        url,
        statusCode,
        duration: `${duration}ms`
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// ============================================================================
// CONTENT SAFETY & ETHICS SYSTEM
// ============================================================================
class ContentSafetyFilter {
  constructor() {
    this.inappropriatePatterns = [
      /\b(violence|kill|murder|death|blood)\b/gi,
      /\b(sexual|explicit|adult)\b/gi,
      /\b(hate|racism|discrimination)\b/gi
    ];
  }
  
  async checkContent(text, userAge = 'unknown') {
    logger.debug('Content safety check initiated:', { 
      textLength: text.length,
      userAge 
    });
    
    const issues = [];
    
    // Basic pattern matching
    for (const pattern of this.inappropriatePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        issues.push({
          type: 'pattern_match',
          pattern: pattern.source,
          matches: matches.length
        });
      }
    }
    
    // Age-appropriate content checking
    if (userAge === 'child' && issues.length > 0) {
      logger.warn('Content safety issue for child user:', issues);
      return {
        safe: false,
        issues,
        suggestion: 'Please use family-friendly content for younger users.'
      };
    }
    
    if (issues.length > 0) {
      logger.warn('Content safety issues detected:', issues);
    }
    
    return {
      safe: issues.length === 0,
      issues,
      confidence: issues.length === 0 ? 1.0 : 0.5
    };
  }
}

// ============================================================================
// AI PROVIDER MANAGEMENT SYSTEM
// ============================================================================
class AIProviderManager {
  constructor() {
    this.providers = {
      openai: {
        name: 'OpenAI',
        enabled: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here',
        client: null,
        models: ['gpt-4-turbo-preview', 'gpt-3.5-turbo'],
        priority: 1,
        errorCount: 0,
        maxErrors: 3
      }
      // Future: Add Anthropic, Cohere, etc.
    };
    
    this.initializeProviders();
  }
  
  initializeProviders() {
    if (this.providers.openai.enabled) {
      this.providers.openai.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      logger.success('OpenAI provider initialized');
    }
  }
  
  async generateText(prompt, options = {}) {
    const { 
      maxTokens = 150, 
      temperature = 0.7, 
      model = 'gpt-4-turbo-preview',
      format = 'story' 
    } = options;
    
    for (const [key, provider] of Object.entries(this.providers)) {
      if (!provider.enabled || provider.errorCount >= provider.maxErrors) {
        continue;
      }
      
      try {
        logger.aiService(key, 'generate_text_start', { 
          promptLength: prompt.length,
          maxTokens,
          model 
        });
        
        const result = await this.callProvider(key, prompt, {
          maxTokens,
          temperature,
          model
        });
        
        // Reset error count on success
        provider.errorCount = 0;
        
        logger.aiService(key, 'generate_text_success', {
          outputLength: result.text.length,
          usage: result.usage
        });
        
        return {
          text: result.text,
          provider: key,
          usage: result.usage,
          success: true
        };
        
      } catch (error) {
        provider.errorCount++;
        logger.error(`AI Provider ${key} failed (${provider.errorCount}/${provider.maxErrors}):`, error.message);
        
        if (provider.errorCount >= provider.maxErrors) {
          logger.warn(`AI Provider ${key} disabled due to repeated failures`);
        }
      }
    }
    
    // All providers failed
    logger.error('All AI providers failed, returning demo content');
    return {
      text: this.generateFallbackContent(prompt, format),
      provider: 'fallback',
      demo: true,
      success: false
    };
  }
  
  async callProvider(providerKey, prompt, options) {
    switch (providerKey) {
      case 'openai':
        return await this.callOpenAI(prompt, options);
      default:
        throw new Error(`Unknown provider: ${providerKey}`);
    }
  }
  
  async callOpenAI(prompt, options) {
    const completion = await this.providers.openai.client.chat.completions.create({
      model: options.model,
      messages: [{
        role: "user",
        content: prompt
      }],
      max_tokens: options.maxTokens,
      temperature: options.temperature
    });
    
    return {
      text: completion.choices[0].message.content.trim(),
      usage: completion.usage
    };
  }
  
  generateFallbackContent(prompt, format) {
    const fallbacks = {
      story: `[DEMO] Based on your input, the story continues:\n\nThe character paused, considering their next move carefully. The air grew thick with anticipation as they reached toward their destiny.\n\nWhat happens next?`,
      comic: `[DEMO] PANEL: The character stands at a crossroads, dramatic lighting emphasizing their internal conflict.\n\nWhat does the character do in the next panel?`,
      screenplay: `[DEMO] INT. LOCATION - DAY\n\nThe PROTAGONIST hesitates, weighing their options. A moment of silence stretches between heartbeats.\n\nWhat happens next in this scene?`
    };
    
    return fallbacks[format] || fallbacks.story;
  }
  
  getProviderStatus() {
    return Object.entries(this.providers).map(([key, provider]) => ({
      name: key,
      enabled: provider.enabled,
      errorCount: provider.errorCount,
      maxErrors: provider.maxErrors,
      status: provider.errorCount >= provider.maxErrors ? 'disabled' : 'active'
    }));
  }
}

// ============================================================================
// RATE LIMITING SYSTEM
// ============================================================================
class RateLimiter {
  constructor() {
    this.requests = new Map(); // IP -> { count, resetTime }
    this.limits = {
      default: { requests: 10, windowMs: 60000 }, // 10 requests per minute
      '/api/enhance-story': { requests: 5, windowMs: 60000 }, // 5 story enhancements per minute
      '/api/continue-story': { requests: 20, windowMs: 60000 } // 20 continuations per minute
    };
  }
  
  checkLimit(ip, endpoint = 'default') {
    const limit = this.limits[endpoint] || this.limits.default;
    const now = Date.now();
    
    if (!this.requests.has(ip)) {
      this.requests.set(ip, { count: 1, resetTime: now + limit.windowMs });
      return { allowed: true, remaining: limit.requests - 1 };
    }
    
    const userRequests = this.requests.get(ip);
    
    // Reset if window expired
    if (now > userRequests.resetTime) {
      this.requests.set(ip, { count: 1, resetTime: now + limit.windowMs });
      return { allowed: true, remaining: limit.requests - 1 };
    }
    
    // Check if over limit
    if (userRequests.count >= limit.requests) {
      logger.warn('Rate limit exceeded:', { ip, endpoint, count: userRequests.count });
      return { 
        allowed: false, 
        remaining: 0,
        resetTime: userRequests.resetTime
      };
    }
    
    // Increment count
    userRequests.count++;
    return { 
      allowed: true, 
      remaining: limit.requests - userRequests.count 
    };
  }
}

// ============================================================================
// INITIALIZE SYSTEMS
// ============================================================================
const app = express();
const PORT = 5001;

// Initialize systems
const contentSafety = new ContentSafetyFilter();
const aiProvider = new AIProviderManager();
const rateLimiter = new RateLimiter();

// Rate limiting middleware
const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const result = rateLimiter.checkLimit(ip, req.path);
  
  if (!result.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      resetTime: result.resetTime,
      message: 'Please try again later'
    });
  }
  
  // Add rate limit headers
  res.set({
    'X-RateLimit-Remaining': result.remaining,
    'X-RateLimit-Reset': result.resetTime
  });
  
  next();
};

// PHASE 3: Visual Generation Configuration
const VISUAL_CONFIG = {
  // Image generation services
  services: {
    dalle: {
      enabled: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here',
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

// Apply logging and rate limiting
app.use(requestLogger);
app.use(rateLimitMiddleware);

// ============================================================================
// ENHANCED FORMAT TEMPLATES WITH SAFETY
// ============================================================================
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
    - Ensure content is appropriate for all ages
    
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
    - Keep content family-friendly and positive
    
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
    - Ensure content is appropriate for comic book audiences
    
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
    - Follow industry-standard formatting
    
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
    - Focus on visual storytelling techniques
    
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
    - Respect manga storytelling conventions
    
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

// ============================================================================
// ENHANCED API ENDPOINTS
// ============================================================================

// NEW: Enhanced iterative story continuation with safety
app.post('/api/continue-story', async (req, res) => {
  const { 
    text, 
    previousContext = '', 
    format = 'story', 
    conversationHistory = [],
    userAge = 'unknown'
  } = req.body;
  
  logger.userAction('continue_story_request', {
    format,
    textLength: text?.length || 0,
    previousContextLength: previousContext.length,
    conversationHistoryLength: conversationHistory.length,
    userAge
  });
  
  if (!text || text.trim().length === 0) {
    logger.warn('Continue story request with empty text');
    return res.status(400).json({ error: 'Text is required' });
  }

  if (text.length > 5000) {
    logger.warn('Continue story request with text too long:', text.length);
    return res.status(400).json({ error: 'Text too long. Please limit to 5,000 characters.' });
  }

  const projectId = uuidv4();
  
  try {
    // Content safety check
    const safetyCheck = await contentSafety.checkContent(text, userAge);
    if (!safetyCheck.safe) {
      logger.warn('Content safety check failed:', safetyCheck.issues);
      return res.status(400).json({
        error: 'Content safety violation',
        issues: safetyCheck.issues,
        suggestion: safetyCheck.suggestion
      });
    }
    
    const result = await continueStoryIteratively(
      text.trim(), 
      previousContext, 
      format, 
      conversationHistory,
      userAge
    );
    
    logger.success('Iterative continuation complete:', {
      projectId,
      outputLength: result.continuation.length,
      demo: result.demo
    });
    
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
      isIterative: true,
      safetyCheck: safetyCheck
    });

  } catch (error) {
    logger.error('Story continuation error:', error);
    res.status(500).json({ 
      error: 'Failed to continue story',
      details: error.message 
    });
  }
});

// Enhanced function for iterative story development with AI provider management
const continueStoryIteratively = async (newInput, previousContext, format, conversationHistory, userAge = 'unknown') => {
  logger.debug('Continuing story iteratively:', { 
    format,
    newInputLength: newInput.length,
    previousContextLength: previousContext.length 
  });
  
  const template = formatTemplates[format] || formatTemplates.story;
  
  // Build context for the AI
  let contextPrompt;
  
  if (previousContext) {
    contextPrompt = `Previous story so far:\n"${previousContext}"\n\nUser's new input: "${newInput}"\n\nContinue the story with just one paragraph and ask what happens next.`;
  } else {
    contextPrompt = `User's story beginning: "${newInput}"\n\nStart the story with one engaging paragraph and ask what happens next.`;
  }

  // Add age-appropriate content guidance
  if (userAge === 'child') {
    contextPrompt += '\n\nIMPORTANT: Keep content family-friendly and appropriate for children.';
  }

  try {
    const aiResult = await aiProvider.generateText(
      template.prompt + '\n\n' + contextPrompt,
      {
        maxTokens: 150,
        temperature: 0.7,
        format: format
      }
    );

    const continuation = aiResult.text;
    const fullStory = previousContext ? previousContext + '\n\n' + continuation : continuation;
    
    // Extract question from the response (should be at the end)
    const questionMatch = continuation.match(/([?].*)$/s);
    const question = questionMatch ? questionMatch[0].trim() : "What happens next?";
    
    logger.aiService('story_generation', 'success', {
      provider: aiResult.provider,
      outputLength: continuation.length,
      demo: aiResult.demo
    });
    
    return {
      continuation,
      fullStory,
      question,
      demo: aiResult.demo || false,
      usage: aiResult.usage,
      provider: aiResult.provider,
      conversationHistory: [...conversationHistory, { 
        input: newInput, 
        output: continuation,
        timestamp: new Date().toISOString(),
        provider: aiResult.provider
      }]
    };

  } catch (error) {
    logger.error('Iterative story continuation error:', error);
    throw error;
  }
};

// Enhanced enhance-story endpoint with better error handling
app.post('/api/enhance-story', async (req, res) => {
  const { 
    text, 
    format = 'story', 
    characters = [], 
    generateVisuals = false,
    useIterative = true,
    previousContext = '',
    conversationHistory = [],
    userAge = 'unknown'
  } = req.body;
  
  logger.userAction('enhance_story_request', {
    format,
    textLength: text?.length || 0,
    generateVisuals,
    useIterative,
    userAge
  });
  
  if (!text || text.trim().length === 0) {
    logger.warn('Enhance story request with empty text');
    return res.status(400).json({ error: 'Text is required' });
  }

  if (text.length > 10000) {
    logger.warn('Enhance story request with text too long:', text.length);
    return res.status(400).json({ error: 'Text too long. Please limit to 10,000 characters.' });
  }

  const projectId = uuidv4();
  
  try {
    // Content safety check
    const safetyCheck = await contentSafety.checkContent(text, userAge);
    if (!safetyCheck.safe) {
      logger.warn('Content safety check failed:', safetyCheck.issues);
      return res.status(400).json({
        error: 'Content safety violation',
        issues: safetyCheck.issues,
        suggestion: safetyCheck.suggestion
      });
    }
    
    let result;
    
    if (useIterative) {
      // Use new iterative approach
      result = await continueStoryIteratively(
        text.trim(), 
        previousContext, 
        format, 
        conversationHistory,
        userAge
      );
      
      logger.success('Iterative enhancement complete:', {
        projectId,
        outputLength: result.continuation.length,
        provider: result.provider
      });
      
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
        provider: result.provider,
        conversationHistory: result.conversationHistory,
        wordCount: result.continuation.split(' ').length,
        isIterative: true,
        safetyCheck: safetyCheck
      });
    } else {
      // Use original full enhancement (for backwards compatibility)
      result = generateVisuals 
        ? await enhanceTextWithVisuals(text.trim(), format, { characters, userAge })
        : await enhanceText(text.trim(), format, { characters, userAge });
      
      // Generate files
      const downloadUrls = await generateFormattedFiles(result, format, projectId);
      
      logger.success('Full enhancement complete:', {
        projectId,
        outputLength: result.enhanced.length,
        hasVisuals: result.hasVisuals
      });
      
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
        safetyCheck: safetyCheck,
        metadata: {
          visualsGenerated: result.hasVisuals,
          imagesCreated: result.visuals ? (result.visuals.panels?.length || result.visuals.illustrations?.length || 0) : 0,
          processingTime: Date.now()
        }
      });
    }

  } catch (error) {
    logger.error('Enhancement error:', error);
    res.status(500).json({ 
      error: 'Failed to enhance story',
      details: error.message 
    });
  }
});

// NEW: Get conversation history with better database simulation
app.get('/api/conversation/:projectId', async (req, res) => {
  const { projectId } = req.params;
  
  logger.userAction('get_conversation_history', { projectId });
  
  // In a real app, you'd query your database here
  // For now, return empty array since we're not persisting conversations
  res.json({
    success: true,
    projectId,
    conversationHistory: [],
    message: "Conversation history would be retrieved from database in production"
  });
});

// NEW: Reset conversation with logging
app.post('/api/reset-conversation', async (req, res) => {
  const { projectId } = req.body;
  
  logger.userAction('reset_conversation', { projectId });
  
  // In a real app, you'd clear the conversation from database
  res.json({
    success: true,
    projectId,
    message: "Conversation reset (would clear database in production)"
  });
});

// NEW: Get AI provider status
app.get('/api/ai-status', (req, res) => {
  const providerStatus = aiProvider.getProviderStatus();
  
  logger.debug('AI provider status requested');
  
  res.json({
    success: true,
    providers: providerStatus,
    timestamp: new Date().toISOString()
  });
});

// NEW: System health check with comprehensive status
app.get('/api/health', (req, res) => {
  const systemStatus = {
    status: 'OK',
    message: 'AuraMythos.ai - Enhanced AI Story Development',
    timestamp: new Date().toISOString(),
    features: [
      'Iterative paragraph-by-paragraph story development',
      'Content safety filtering',
      'Multi-provider AI system with fallbacks',
      'Rate limiting and security',
      'Comprehensive logging and monitoring',
      'Visual generation capabilities'
    ],
    services: {
      ai: aiProvider.getProviderStatus(),
      visual: {
        dalle: VISUAL_CONFIG.services.dalle.enabled,
        midjourney: VISUAL_CONFIG.services.midjourney.enabled,
        stability: VISUAL_CONFIG.services.stability.enabled
      },
      safety: {
        contentFilter: true,
        rateLimiting: true
      }
    },
    formats: Object.keys(formatTemplates),
    iterativeMode: true,
    environment: process.env.NODE_ENV || 'development'
  };
  
  logger.info('Health check requested', systemStatus);
  
  res.json(systemStatus);
});

// Enhanced formats endpoint
app.get('/api/formats', (req, res) => {
  const formats = Object.keys(formatTemplates).map(key => ({
    id: key,
    name: formatTemplates[key].name,
    description: 'Iterative development - one paragraph at a time',
    iterative: true,
    safetyEnabled: true
  }));
  
  logger.debug('Formats requested');
  
  res.json({ 
    formats,
    iterativeMode: true,
    message: 'All formats support iterative development with safety filtering'
  });
});

// ============================================================================
// VISUAL GENERATION SYSTEM (ENHANCED)
// ============================================================================

class VisualGenerator {
  constructor() {
    this.generatedImages = new Map();
    this.characterDesigns = new Map();
  }

  async generateImage(prompt, style = 'realistic', service = 'dalle') {
    logger.debug('Image generation requested:', { 
      service, 
      style, 
      promptLength: prompt.length 
    });
    
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
      logger.error(`Image generation failed with ${service}:`, error);
      return this.generateFallbackImage(prompt, style);
    }
  }

  async generateWithDALLE(prompt, style) {
    if (!VISUAL_CONFIG.services.dalle.enabled) {
      throw new Error('DALL-E not configured');
    }

    const stylePrompt = this.enhancePromptWithStyle(prompt, style);
    
    logger.aiService('dalle', 'generate_image_start', { 
      promptLength: stylePrompt.length 
    });

    const response = await aiProvider.providers.openai.client.images.generate({
      model: 'dall-e-3',
      prompt: stylePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard'
    });

    const imageUrl = response.data[0].url;
    const localPath = await this.downloadAndSaveImage(imageUrl);
    
    logger.aiService('dalle', 'generate_image_success', { 
      imageUrl, 
      localPath 
    });
    
    return {
      url: imageUrl,
      localPath,
      service: 'dalle',
      prompt: stylePrompt,
      style
    };
  }

  async generateWithMidjourney(prompt, style) {
    logger.debug('Midjourney generation would happen here');
    return this.generateFallbackImage(prompt, style);
  }

  async generateWithStability(prompt, style) {
    if (!VISUAL_CONFIG.services.stability.enabled) {
      throw new Error('Stability AI not configured');
    }

    const stylePrompt = this.enhancePromptWithStyle(prompt, style);
    
    logger.aiService('stability', 'generate_image_start', { 
      promptLength: stylePrompt.length 
    });
    
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
    
    logger.aiService('stability', 'generate_image_success', { 
      localPath 
    });
    
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
    
    logger.debug('Downloading image:', { imageUrl, imagePath });
    
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
          logger.success('Image saved successfully:', imagePath);
          resolve(`/images/${imageId}.png`);
        });
        writer.on('error', (error) => {
          logger.error('Image save failed:', error);
          reject(error);
        });
      });
    } catch (error) {
      logger.error('Image download failed:', error);
      throw error;
    }
  }

  async saveBase64Image(base64Data) {
    const imageId = uuidv4();
    const imagePath = path.join('generated_images', `${imageId}.png`);
    
    await fs.ensureDir('generated_images');
    await fs.writeFile(imagePath, base64Data, 'base64');
    
    logger.success('Base64 image saved:', imagePath);
    
    return `/images/${imageId}.png`;
  }

  generateFallbackImage(prompt, style) {
    logger.debug('Generating fallback image for demo mode');
    
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

// ============================================================================
// ENHANCED HELPER FUNCTIONS
// ============================================================================

const enhanceTextWithVisuals = async (rawText, format = 'book', options = {}) => {
  logger.debug('Enhancing text with visuals:', { 
    format, 
    textLength: rawText.length 
  });
  
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
        logger.debug('No visual generation for format:', format);
    }
    
  } catch (error) {
    logger.error('Visual generation failed:', error);
    visualContent = { error: error.message, demo: true };
  }
  
  return {
    ...textResult,
    visuals: visualContent,
    hasVisuals: !!visualContent && !visualContent.error
  };
};

const enhanceText = async (rawText, format = 'book', options = {}) => {
  logger.debug('Processing text enhancement:', { 
    format, 
    textLength: rawText.length 
  });
  
  const template = formatTemplates[format] || formatTemplates.book;
  
  try {
    let enhancedPrompt = template.prompt;
    
    if (options.characters && options.characters.length > 0) {
      enhancedPrompt += `\n\nCharacter consistency: ${options.characters.map(c => `${c.name}: ${c.description}`).join(', ')}`;
    }

    // Add age-appropriate content guidance
    if (options.userAge === 'child') {
      enhancedPrompt += '\n\nIMPORTANT: Keep content family-friendly and appropriate for children.';
    }

    const aiResult = await aiProvider.generateText(
      enhancedPrompt + '\n\n' + rawText,
      {
        maxTokens: 3000,
        temperature: 0.7,
        format: format
      }
    );

    const enhancedText = aiResult.text;
    
    logger.success('Text enhancement complete:', {
      originalLength: rawText.length,
      enhancedLength: enhancedText.length,
      provider: aiResult.provider
    });
    
    return {
      original: rawText,
      enhanced: enhancedText,
      format: format,
      demo: aiResult.demo || false,
      usage: aiResult.usage,
      provider: aiResult.provider,
      characters: extractCharacters(enhancedText),
      scenes: extractScenes(enhancedText),
      wordCount: enhancedText.split(' ').length
    };

  } catch (error) {
    logger.error('Text enhancement error:', error);
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
  
  logger.debug('Characters extracted:', characters.length);
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
  
  logger.debug('Scenes extracted:', scenes.length);
  return scenes;
}

function formatDemoText(text, format) {
  const template = formatTemplates[format];
  if (!template) return text;
  
  return `[DEMO MODE - ${template.name}]\n\n${text}\n\n[AI would continue with one paragraph and ask what happens next]`;
}

const generateFormattedFiles = async (result, format, projectId) => {
  logger.debug('Generating formatted files:', { format, projectId });
  
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
  
  logger.success('Formatted files generated:', files);
  
  return files;
};

function generateVisualHTML(result, format, projectId) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AuraMythos ${format.charAt(0).toUpperCase() + format.slice(1)} Story</title>
      <style>
        body { font-family: 'Georgia', serif; line-height: 1.6; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .content { max-width: 800px; margin: 0 auto; }
        .footer { text-align: center; margin-top: 40px; color: #666; }
      </style>
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
        <p>Project ID: ${projectId}</p>
      </div>
    </body>
    </html>
  `;
}

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================
app.use((error, req, res, next) => {
  logger.error('Unhandled server error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong on our end',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Create required directories
const dirs = ['uploads', 'outputs', 'generated_images'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.success('Directory created:', dir);
  }
});

app.listen(PORT, () => {
  logger.success(`AuraMythos Enhanced Server running on http://localhost:${PORT}`);
  
  console.log(`\n🎨 AuraMythos Enhanced AI Story Development Server`);
  console.log(`📁 Output directory: ${path.resolve('outputs')}`);
  console.log(`🖼️  Images directory: ${path.resolve('generated_images')}`);
  
  console.log(`\n🤖 AI Services Status:`);
  const providerStatus = aiProvider.getProviderStatus();
  providerStatus.forEach(provider => {
    console.log(`   ${provider.status === 'active' ? '✅' : '❌'} ${provider.name.toUpperCase()}: ${provider.status}`);
  });
  
  console.log(`\n🛡️ Security & Safety Features:`);
  console.log(`   ✅ Content Safety Filtering`);
  console.log(`   ✅ Rate Limiting (${rateLimiter.limits.default.requests} req/min)`);
  console.log(`   ✅ Comprehensive Request Logging`);
  console.log(`   ✅ Error Boundary Protection`);
  
  console.log(`\n🚀 Enhanced Features Active:`);
  console.log(`   ✅ Multi-Provider AI System with Fallbacks`);
  console.log(`   ✅ Iterative Story Development`);
  console.log(`   ✅ Age-Appropriate Content Filtering`);
  console.log(`   ✅ Performance Monitoring`);
  console.log(`   ✅ Visual Generation (DALL-E 3)`);
  console.log(`   ✅ Real-time Safety Checking`);
  
  console.log(`\n📚 Available Formats: ${Object.keys(formatTemplates).join(', ')}`);
  console.log(`🔄 Mode: Enhanced Iterative with Safety & Logging`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') {
    logger.warn('Demo Mode: Add OPENAI_API_KEY to .env file for full AI functionality');
  } else {
    logger.success('AI Enhanced: Ready for production story development');
  }
});