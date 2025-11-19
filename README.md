# 🚀 KodesCRUxxx - AI Coding Assistant

![KodesCRUxxx](https://img.shields.io/badge/AI-Powered-blue)
![Python](https://img.shields.io/badge/Python-3.8+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

**KodesCRUxxx** is a comprehensive AI-powered coding assistant that helps developers and students learn, debug, generate, and analyze code efficiently. Built with modern technologies and powered by OpenAI's GPT models.

---

## ✨ Features

### 🎓 Learning Tools
- **📖 Code Explanation**: Get clear, beginner-friendly explanations of programming concepts
- **🗺 Learning Roadmaps**: Personalized learning paths tailored to your level
- **💡 Project Ideas**: Innovative project suggestions for hands-on practice

### 🛠 Development Tools
- **🔍 Debug Code**: AI-powered bug detection and fixing
- **💡 Code Generation**: Instant code examples and templates
- **🔄 Logic Conversion**: Transform pseudo-code into working code
- **📊 Complexity Analysis**: Analyze time and space complexity
- **🔍 Code Tracer**: Step-by-step execution visualization
- **▶️ Code Playground**: Execute code in multiple languages with real-time output

### 👥 Collaborative Coding (NEW!)
- **🏠 Collaborative Rooms**: Create or join real-time collaborative coding sessions
- **💬 Real-time Chat**: Text chat with other collaborators in the room
- **🎤 Voice Chat**: Real-time voice communication using WebRTC audio streaming
- **👨‍💻 Live Code Editing**: See code changes from other users in real-time
- **▶️ Shared Code Execution**: Execute code together with synchronized input/output
- **👥 User Presence**: See who's in the room with color-coded cursors
- **🌐 Public Rooms**: Browse and join public collaborative rooms

### 📚 Resources
- **📚 Snippets Library**: Curated collection of useful code snippets
- **🎯 Multi-language Support**: Python, JavaScript, Java, C++, Go, Rust, and more
- **🎨 Modern UI**: Clean, responsive interface with smooth scrolling and professional design

---

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **WebSockets** - Real-time bidirectional communication
- **OpenAI** - GPT models via LangChain
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Monaco Editor** - Code editor with syntax highlighting
- **React Markdown** - Markdown rendering for responses
- **WebSocket API** - Real-time collaboration
- **MediaRecorder API** - Voice chat functionality

---

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- Node.js 18+ and npm
- OpenAI API key
- Modern web browser with WebSocket and MediaRecorder API support (Chrome, Firefox, Edge, Safari)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/kodescru-xxx.git
cd kodescru-xxx
```

2. **Set up environment variables**
```bash
# Create .env file in root directory
cp .env.example .env
# Edit .env and add your OpenAI API key
OPENAI_API_KEY=your_api_key_here
```

3. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

4. **Install frontend dependencies**
```bash
cd frontend
npm install
cd ..
```

### Running the Application

#### Option 1: Run Both Services (Recommended)

**Terminal 1 - Backend:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

#### Option 2: Using Scripts

Create a `start.sh` script:
```bash
#!/bin/bash
# Start backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
# Start frontend
cd frontend && npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🌐 Deployment

KodesCRUxxx is ready for deployment on:
- **Backend**: Render.com
- **Frontend**: Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

---

## 📁 Project Structure

```
kodescru-xxx/
├── .env.example          # Environment variables template
├── .gitignore
├── requirements.txt      # Python dependencies
├── README.md
├── config.py            # Configuration settings
├── ai_engine.py         # AI/LLM interactions
├── main.py              # FastAPI backend with WebSocket support
├── app.py               # Streamlit frontend (legacy)
├── room_manager.py      # Collaborative room management
├── websocket_handler.py # WebSocket message handling
├── code_executor.py     # Code execution engine
├── logo.jpg
├── frontend/            # React frontend
│   ├── src/
│   │   ├── App.tsx      # Main React component
│   │   ├── index.css    # Global styles
│   │   ├── main.tsx     # React entry point
│   │   ├── components/
│   │   │   └── CollaborativeRoom.tsx  # Collaborative coding component
│   │   ├── services/
│   │   │   ├── api.ts   # REST API service layer
│   │   │   └── websocket.ts  # WebSocket service
│   │   └── vite-env.d.ts
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
├── utils/
│   ├── __init__.py
│   └── helpers.py
└── tests/
    ├── __init__.py
    └── test_ai_engine.py
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_api_key_here
MODEL_NAME=gpt-4o-mini
TEMPERATURE=0.7
MAX_TOKENS=1000

# API Configuration
API_URL=http://127.0.0.1:8000
API_HOST=0.0.0.0
API_PORT=8000

# Application Settings
DEBUG=False
LOG_LEVEL=INFO
```

### Frontend Configuration

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_ASSET_BASE_URL=http://localhost:8000
```

---

## 📡 API Endpoints

### REST API Endpoints

All endpoints accept POST requests with JSON body (unless specified):

**AI Features:**
- `POST /explain` - Explain a coding concept
- `POST /debug` - Debug code
- `POST /generate` - Generate code
- `POST /convert_logic` - Convert logic to code
- `POST /analyze_complexity` - Analyze code complexity
- `POST /trace_code` - Trace code execution
- `POST /get_snippets` - Get code snippets
- `POST /get_projects` - Get project ideas
- `POST /get_roadmaps` - Get learning roadmaps
- `POST /execute_code` - Execute code in playground

**Code Execution:**
- `GET /supported_languages` - Get list of supported languages
- `GET /runtimes` - Get detailed runtime information

**Room Management:**
- `POST /rooms/create` - Create a new collaborative room
- `GET /rooms` - List all public rooms
- `GET /rooms/{room_id}` - Get room information
- `DELETE /rooms/{room_id}` - Delete a room (if empty)

**System:**
- `GET /health` - Health check

### WebSocket Endpoints

**Collaborative Rooms:**
- `WS /ws/{room_id}` - Real-time collaborative coding room

**WebSocket Message Types:**
- `join` - Join a room (requires `room_id`, `user_name`)
- `leave` - Leave the current room
- `code_change` - Broadcast code changes (requires `room_id`, `code`)
- `cursor_move` - Broadcast cursor position (requires `room_id`, `position`)
- `language_change` - Change programming language (requires `room_id`, `language`)
- `chat_message` - Send chat message (requires `room_id`, `message`)
- `voice_audio` - Broadcast voice audio data (requires `room_id`, `audio_data`)
- `execute_code` - Broadcast code execution result (requires `room_id`, `result`)

See `/docs` for interactive API documentation.

---

## 🎨 UI Features

- **Fixed Sidebar**: Feature selection menu remains visible while scrolling
- **Scrollable Content**: Main content area scrolls independently
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Code Editor**: Monaco Editor with syntax highlighting for multiple languages
- **Markdown Rendering**: Beautiful formatted responses with code blocks
- **Real-time Execution**: Code playground with live output and error handling
- **Collaborative Rooms**: Real-time multi-user coding sessions
- **Voice Chat**: Real-time voice communication with push-to-talk
- **Live Code Sync**: See code changes from other users instantly
- **Shared Terminal**: Input/output sections for collaborative code execution

## 🧪 Testing

```bash
# Run backend tests
pytest tests/

# Run frontend tests (if configured)
cd frontend
npm test
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📝 License

This project is licensed under the MIT License.

---

## 🐛 Troubleshooting

### Backend Connection Issues
If you see "Backend not connected" in the UI:
1. Ensure the backend server is running on port 8000
2. Check that `uvicorn main:app --reload --host 0.0.0.0 --port 8000` is running
3. Verify the backend health endpoint: `http://localhost:8000/health`

### WebSocket Connection Issues
If you can't connect to collaborative rooms:
1. Ensure the backend is running and WebSocket endpoint is accessible
2. Check browser console for WebSocket errors
3. Verify firewall/network settings allow WebSocket connections
4. Try using `ws://localhost:8000` instead of `wss://` for local development

### Voice Chat Issues
If voice chat doesn't work:
1. Grant microphone permissions when prompted by the browser
2. Check browser settings to ensure microphone access is allowed
3. Use HTTPS in production (required for microphone access on most browsers)
4. Try a different browser if issues persist (Chrome/Firefox recommended)

### Collaborative Room Issues
If you can't join or create rooms:
1. Verify the backend is running and accessible
2. Check that room ID is correct (8-character alphanumeric)
3. Ensure the room hasn't reached maximum user limit
4. Check browser console for error messages

### CSS Linter Warnings
If you see "Unknown at rule @tailwind" warnings:
- These are harmless and can be ignored
- The Tailwind directives are processed correctly by PostCSS
- To suppress in VS Code/Cursor, add to `.vscode/settings.json`:
  ```json
  {
    "css.lint.unknownAtRules": "ignore"
  }
  ```

## 🎯 Usage Guide

### Collaborative Coding

1. **Create a Room:**
   - Navigate to "Collaborative Rooms" in the sidebar
   - Enter your name and room name
   - Select programming language
   - Optionally add initial code
   - Click "Create Room"

2. **Join a Room:**
   - Enter your name and room ID
   - Or click on a public room from the list
   - Click "Join Room"

3. **Collaborate:**
   - Code changes sync automatically with other users
   - Use the chat panel for text communication
   - Enable voice chat by clicking the microphone button
   - Execute code using the "Run Code" button
   - Share input/output with collaborators

4. **Voice Chat:**
   - Click the microphone icon in the chat panel
   - Grant microphone permissions when prompted
   - Click the mic button to start/stop recording
   - Voice is broadcast to all users in the room

### Code Execution

1. **In Collaborative Rooms:**
   - Write code in the shared editor
   - Add input in the "Input (stdin)" section if needed
   - Click "Run Code" button
   - View results in the "Output" section
   - Results are shared with all room participants

2. **In Code Playground:**
   - Select a programming language
   - Write or paste your code
   - Add standard input if required
   - Click "Run Code" to execute

---

## 🙏 Acknowledgments

- OpenAI for GPT models
- LangChain for LLM integration
- FastAPI for the backend framework
- React team for the frontend framework
- Monaco Editor for the code editing experience
- WebSocket technology for real-time collaboration

---

**Built with ❤️ using FastAPI, React, WebSockets, and OpenAI**
