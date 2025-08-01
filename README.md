# 🎨 AuraMythos.ai

> **Where Your Voice Becomes Legendary Visual Stories**

Transform your spoken words into captivating narratives with AI-generated visuals. Just speak naturally, and watch our AI weave magic into compelling stories, comic books, screenplays, and more.

![AuraMythos Demo](https://via.placeholder.com/800x400?text=AuraMythos+Demo+Screenshot)

## ✨ Features

- 🎤 **Voice-First Design** - Speak naturally, AI handles the rest
- 📖 **Multiple Story Formats** - Books, comics, screenplays, storyboards
- 🎨 **AI Visual Generation** - DALL-E 3, Midjourney, Stability AI integration
- 🖼️ **Comic Book Creation** - Automatic panel generation with artwork
- 🎬 **Storyboard Generation** - Professional production-ready visuals
- 📱 **AudioPen-Inspired UX** - Clean, voice-first interface
- 📄 **Multiple Export Formats** - HTML, PDF, text downloads
- 🎯 **Demo Mode** - Try without API keys

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- OpenAI API key (optional for demo)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/auramythos.git
   cd auramythos
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start the application**
   ```bash
   # Terminal 1: Start backend server
   cd backend
   npm start

   # Terminal 2: Start frontend
   cd frontend
   npm start
   ```

5. **Open your browser**
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:5001`
   - Test Interface: `http://localhost:5001/test`

## 🎯 How It Works

1. **🎤 Record or Type** - Share your story using voice or text
2. **📚 Choose Format** - Select from book, comic, screenplay, etc.
3. **🎨 AI Magic** - Our AI enhances text and generates visuals
4. **📖 Get Results** - Download your transformed story with images

## 🔧 Configuration

### API Keys Setup

Add your API keys to `backend/.env`:

```env
# Required for full functionality
OPENAI_API_KEY=sk-your-openai-key-here

# Optional for additional image generation
MIDJOURNEY_API_KEY=your-midjourney-key-here
STABILITY_API_KEY=your-stability-key-here
```

### Supported Formats

| Format | Description | Visual Generation |
|--------|-------------|-------------------|
| 📖 **Book** | Rich prose with illustrations | Key scene artwork |
| 💭 **Comic** | Full comic book with panels | Dynamic comic panels |
| 🎬 **Screenplay** | Professional script format | Storyboard frames |
| ✨ **Story** | Engaging short story | Scene illustrations |
| 🎌 **Manga** | Japanese comic style | Manga-style panels |
| 📋 **Storyboard** | Production storyboard | Sequential frames |

## 🎨 Visual Generation

AuraMythos supports multiple AI image generation services:

- **DALL-E 3** (OpenAI) - High quality, prompt-adherent images
- **Midjourney** (API) - Artistic, stylized images  
- **Stability AI** - Fast, customizable generation

### Visual Styles
- 🎨 Comic Book - Vibrant colors, dynamic composition
- 🎌 Manga - Black & white, detailed lineart
- 📸 Photorealistic - Lifelike, detailed imagery
- 🖼️ Digital Art - Artistic, stylized illustration
- ✏️ Storyboard - Professional sketch style
- ✋ Hand-drawn - Pencil sketch aesthetic

## 📁 Project Structure

```
auramythos/
├── 🎨 frontend/           # React application
│   ├── src/
│   │   ├── App.js         # Main AudioPen-inspired UI
│   │   └── components/    # React components
│   └── public/
├── ⚙️ backend/            # Node.js server
│   ├── server.js          # Express server with AI integration
│   ├── generated_images/  # AI-generated images
│   └── outputs/           # Generated story files
├── 📖 docs/              # Documentation
└── 🧪 tests/             # Test files
```

## 🛠️ Development

### Available Scripts

**Backend:**
```bash
npm start          # Start production server
npm run dev        # Start with nodemon (development)
npm test           # Run tests
```

**Frontend:**
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/enhance-story` | POST | Transform text with optional visuals |
| `/api/generate-image` | POST | Generate single image |
| `/api/generate-storyboard` | POST | Create storyboard |
| `/api/generate-comic` | POST | Create comic pages |
| `/api/health` | GET | Server health check |
| `/api/formats` | GET | Available story formats |

## 🎭 Demo Mode

AuraMythos works without API keys in demo mode:
- ✅ Text enhancement (basic formatting)
- ✅ UI/UX demonstration
- ✅ Story structure analysis
- ❌ AI image generation (shows placeholders)
- ❌ Advanced AI text enhancement

Perfect for testing and development!

## 🚀 Deployment

### Environment Setup

**Development:**
```bash
NODE_ENV=development
PORT=5001
```

**Production:**
```bash
NODE_ENV=production
PORT=80
OPENAI_API_KEY=your-production-key
```

### Docker Support (Coming Soon)
```bash
docker-compose up --build
```

## 🤝 Contributing

We love contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [AudioPen.ai](https://audiopen.ai) for the clean, voice-first UX
- OpenAI for DALL-E 3 and GPT models
- The React and Node.js communities
- All our beta testers and contributors

## 📞 Support

- 📧 Email: support@auramythos.ai
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/auramythos/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/auramythos/discussions)

---

**Made with ❤️ by the AuraMythos team**

*Transform your voice into legendary stories* ✨