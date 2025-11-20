import { useState, useEffect, useMemo, useCallback } from 'react';
import Snowfall from 'react-snowfall';
import { Code2, Bug, Sparkles, ArrowRightLeft, BarChart3, Play, FileCode, Lightbulb, Map, Languages, BookOpen, GraduationCap, Code, FileText, ChevronDown, AlertCircle, Terminal, CheckCircle, XCircle, Linkedin, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Editor from '@monaco-editor/react';
import { apiService } from './services/api';
import CollaborativeRoom from './components/CollaborativeRoom';

type Feature = 
  | 'explain' 
  | 'debug' 
  | 'generate' 
  | 'convert' 
  | 'complexity' 
  | 'trace' 
  | 'snippets' 
  | 'projects' 
  | 'roadmaps'
  | 'playground'
  | 'collaborate';

function App() {
  const [activeFeature, setActiveFeature] = useState<Feature>('explain');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  // Form states
  const [language, setLanguage] = useState('python');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [code, setCode] = useState('');
  const [logic, setLogic] = useState('');
  
  // Playground states
  const [playgroundCode, setPlaygroundCode] = useState('print("Hello, World!")');
  const [playgroundLanguage, setPlaygroundLanguage] = useState('Python');
  const [playgroundStdin, setPlaygroundStdin] = useState('');
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);

  const assetBaseUrl = useMemo(() => {
    const assetEnv = import.meta.env.VITE_ASSET_BASE_URL;
    if (assetEnv) {
      return assetEnv.replace(/\/$/, '');
    }
    const apiEnv = import.meta.env.VITE_API_URL;
    if (apiEnv) {
      return apiEnv.replace(/\/$/, '');
    }
    if (import.meta.env.DEV) {
      return 'http://localhost:8000';
    }
    return 'https://kodescruxxx.onrender.com';
  }, []);

  const buildImageUrl = useCallback((filename: string) => {
    const encoded = encodeURIComponent(filename);
    return `${assetBaseUrl}/images/${encoded}`;
  }, [assetBaseUrl]);

  const featureBackgrounds = useMemo<Record<Feature, string>>(() => ({
    explain: buildImageUrl('Generated Image November 19, 2025 - 1_23PM.png'),
    debug: buildImageUrl('Generated Image November 19, 2025 - 1_24PM.png'),
    generate: buildImageUrl('Generated Image November 19, 2025 - 1_24PM (1).png'),
    convert: buildImageUrl('Generated Image November 19, 2025 - 1_25PM.png'),
    complexity: buildImageUrl('Generated Image November 19, 2025 - 1_26PM.png'),
    trace: buildImageUrl('Generated Image November 19, 2025 - 1_27PM.png'),
    snippets: buildImageUrl('Generated Image November 19, 2025 - 1_29PM.png'),
    projects: buildImageUrl('Generated Image November 19, 2025 - 1_30PM.png'),
    roadmaps: buildImageUrl('Generated Image November 19, 2025 - 1_31PM.png'),
    playground: buildImageUrl('Generated Image November 19, 2025 - 1_33PM.png'),
    collaborate: buildImageUrl('Generated Image November 19, 2025 - 1_33PM (1).png'),
  }), [buildImageUrl]);

  const featureBackgroundStyle = useMemo(() => {
    // Don't apply background to collaborate feature
    if (activeFeature === 'collaborate') {
      return {};
    }

    const imageUrl = featureBackgrounds[activeFeature];
    if (!imageUrl) {
      return {};
    }

    return {
      backgroundImage: `linear-gradient(135deg, rgba(12,20,39,0.78), rgba(11,15,25,0.72)), url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }, [featureBackgrounds, activeFeature]);

  // Stable snow animation props to prevent re-initialization
  const snowSpeed = useMemo(() => [0.4, 1.2] as [number, number], []);
  const snowWind = useMemo(() => [-0.2, 0.6] as [number, number], []);
  const snowRadius = useMemo(() => [1.2, 3.6] as [number, number], []);

  // Check backend connection on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/health`);
        if (response.ok) {
          setBackendConnected(true);
        } else {
          setBackendConnected(false);
        }
      } catch (error) {
        console.error('Backend connection check failed:', error);
        setBackendConnected(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { id: 'explain' as Feature, icon: Code2, label: 'Explain Code', color: 'blue' },
    { id: 'debug' as Feature, icon: Bug, label: 'Debug Code', color: 'red' },
    { id: 'generate' as Feature, icon: Sparkles, label: 'Generate Code', color: 'purple' },
    { id: 'convert' as Feature, icon: ArrowRightLeft, label: 'Convert Logic', color: 'green' },
    { id: 'complexity' as Feature, icon: BarChart3, label: 'Analyze Complexity', color: 'orange' },
    { id: 'trace' as Feature, icon: Play, label: 'Trace Code', color: 'cyan' },
    { id: 'snippets' as Feature, icon: FileCode, label: 'Code Snippets', color: 'pink' },
    { id: 'projects' as Feature, icon: Lightbulb, label: 'Project Ideas', color: 'yellow' },
    { id: 'roadmaps' as Feature, icon: Map, label: 'Learning Roadmaps', color: 'indigo' },
    { id: 'playground' as Feature, icon: Terminal, label: 'Code Playground', color: 'emerald' },
    { id: 'collaborate' as Feature, icon: Users, label: 'Collaborative Rooms', color: 'violet' },
  ];
  
  // Load supported languages on mount
  useEffect(() => {
    const loadSupportedLanguages = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/supported_languages`);
        if (response.ok) {
          const data = await response.json();
          setSupportedLanguages(data.languages || []);
        }
      } catch (error) {
        console.error('Failed to load supported languages:', error);
      }
    };
    loadSupportedLanguages();
  }, []);

  const getMonacoLanguage = (lang: string): string => {
    const langMap: { [key: string]: string } = {
      'python': 'python',
      'javascript': 'javascript',
      'typescript': 'typescript',
      'java': 'java',
      'cpp': 'cpp',
      'c++': 'cpp',
      'c': 'c',
      'csharp': 'csharp',
      'c#': 'csharp',
      'ruby': 'ruby',
      'go': 'go',
      'rust': 'rust',
      'php': 'php',
      'swift': 'swift',
      'kotlin': 'kotlin',
      'r': 'r',
      'perl': 'perl',
      'lua': 'lua',
      'bash': 'shell',
      'scala': 'scala',
      'Python': 'python',
      'JavaScript': 'javascript',
      'TypeScript': 'typescript',
      'Java': 'java',
      'C++': 'cpp',
      'C': 'c',
      'C#': 'csharp',
      'Ruby': 'ruby',
      'Go': 'go',
      'Rust': 'rust',
      'PHP': 'php',
      'Swift': 'swift',
      'Kotlin': 'kotlin',
      'R': 'r',
      'Perl': 'perl',
      'Lua': 'lua',
      'Bash': 'shell',
      'Scala': 'scala',
    };
    return langMap[lang] || 'plaintext';
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      // Handle playground separately (no streaming needed)
      if (activeFeature === 'playground') {
        if (!playgroundCode || !playgroundLanguage) {
          setError('Please provide code and select a language');
          setLoading(false);
          return;
        }
        const execResult = await apiService.executeCode(
          playgroundCode,
          playgroundLanguage,
          playgroundStdin
        );
        setExecutionResult(execResult);
        setLoading(false);
        return;
      }

      // Use streaming for all other features
      let streamFunction: (onChunk: (chunk: string) => void) => Promise<void>;
      
      switch (activeFeature) {
        case 'explain':
          if ((!topic && !code) || !language || !level) {
            setError('Please provide either code or topic, along with language and level');
            setLoading(false);
            return;
          }
          streamFunction = (onChunk) => apiService.streamExplainCode(language, topic, level, code, onChunk);
          break;
        
        case 'debug':
          if (!code || !language) {
            setError('Please provide code and language');
            setLoading(false);
            return;
          }
          streamFunction = (onChunk) => apiService.streamDebugCode(language, code, topic, onChunk);
          break;
        
        case 'generate':
          if (!topic || !language || !level) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
          }
          streamFunction = (onChunk) => apiService.streamGenerateCode(language, topic, level, onChunk);
          break;
        
        case 'convert':
          if (!logic || !language) {
            setError('Please provide logic and target language');
            setLoading(false);
            return;
          }
          streamFunction = (onChunk) => apiService.streamConvertLogic(logic, language, onChunk);
          break;
        
        case 'complexity':
          if (!code) {
            setError('Please provide code to analyze');
            setLoading(false);
            return;
          }
          streamFunction = (onChunk) => apiService.streamAnalyzeComplexity(code, onChunk);
          break;
        
        case 'trace':
          if (!code || !language) {
            setError('Please provide code and language');
            setLoading(false);
            return;
          }
          streamFunction = (onChunk) => apiService.streamTraceCode(code, language, onChunk);
          break;
        
        case 'snippets':
          if (!topic || !language) {
            setError('Please provide topic and language');
            setLoading(false);
            return;
          }
          streamFunction = (onChunk) => apiService.streamGetSnippets(language, topic, onChunk);
          break;
        
        case 'projects':
          if (!topic || !level) {
            setError('Please provide topic and level');
            setLoading(false);
            return;
          }
          streamFunction = (onChunk) => apiService.streamGetProjects(level, topic, onChunk);
          break;
        
        case 'roadmaps':
          if (!topic || !level) {
            setError('Please provide topic and level');
            setLoading(false);
            return;
          }
          streamFunction = (onChunk) => apiService.streamGetRoadmaps(level, topic, onChunk);
          break;
        
        default:
          setLoading(false);
          return;
      }

      // Stream the response - backend sends immediate empty chunk, then real content
      await streamFunction((chunk: string) => {
        setResponse(prev => prev + chunk);
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (activeFeature) {
      case 'explain':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <Languages className="w-4 h-4" />
                Programming Language
              </label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all backdrop-blur-sm appearance-none cursor-pointer hover:bg-white/10"
                >
                  <option value="python" className="bg-slate-800">Python</option>
                  <option value="javascript" className="bg-slate-800">JavaScript</option>
                  <option value="typescript" className="bg-slate-800">TypeScript</option>
                  <option value="java" className="bg-slate-800">Java</option>
                  <option value="cpp" className="bg-slate-800">C++</option>
                  <option value="c" className="bg-slate-800">C</option>
                  <option value="go" className="bg-slate-800">Go</option>
                  <option value="rust" className="bg-slate-800">Rust</option>
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <Code className="w-4 h-4" />
                Code (Optional)
              </label>
              <div className="rounded-xl overflow-hidden border border-emerald-500/30 shadow-lg" style={{ height: '400px' }}>
                <Editor
                  height="100%"
                  language={getMonacoLanguage(language)}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                    padding: { top: 12, bottom: 12 },
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <BookOpen className="w-4 h-4" />
                Topic or Concept
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., recursion, async/await, classes (or leave empty if explaining code above)"
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all backdrop-blur-sm hover:bg-white/10"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <GraduationCap className="w-4 h-4" />
                Level
              </label>
              <div className="relative">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all backdrop-blur-sm appearance-none cursor-pointer hover:bg-white/10"
                >
                  <option value="Beginner" className="bg-slate-800">Beginner</option>
                  <option value="Intermediate" className="bg-slate-800">Intermediate</option>
                  <option value="Advanced" className="bg-slate-800">Advanced</option>
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        );
      
      case 'generate':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <Languages className="w-4 h-4" />
                Programming Language
              </label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all backdrop-blur-sm appearance-none cursor-pointer hover:bg-white/10"
                >
                  <option value="python" className="bg-slate-800">Python</option>
                  <option value="javascript" className="bg-slate-800">JavaScript</option>
                  <option value="typescript" className="bg-slate-800">TypeScript</option>
                  <option value="java" className="bg-slate-800">Java</option>
                  <option value="cpp" className="bg-slate-800">C++</option>
                  <option value="c" className="bg-slate-800">C</option>
                  <option value="go" className="bg-slate-800">Go</option>
                  <option value="rust" className="bg-slate-800">Rust</option>
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <BookOpen className="w-4 h-4" />
                Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., recursion, async/await, classes"
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all backdrop-blur-sm hover:bg-white/10"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <GraduationCap className="w-4 h-4" />
                Level
              </label>
              <div className="relative">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all backdrop-blur-sm appearance-none cursor-pointer hover:bg-white/10"
                >
                  <option value="Beginner" className="bg-slate-800">Beginner</option>
                  <option value="Intermediate" className="bg-slate-800">Intermediate</option>
                  <option value="Advanced" className="bg-slate-800">Advanced</option>
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        );
      
      case 'debug':
      case 'trace':
      case 'complexity':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <Languages className="w-4 h-4" />
                Programming Language
              </label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all backdrop-blur-sm appearance-none cursor-pointer hover:bg-white/10"
                >
                  <option value="python" className="bg-slate-800">Python</option>
                  <option value="javascript" className="bg-slate-800">JavaScript</option>
                  <option value="typescript" className="bg-slate-800">TypeScript</option>
                  <option value="java" className="bg-slate-800">Java</option>
                  <option value="cpp" className="bg-slate-800">C++</option>
                  <option value="c" className="bg-slate-800">C</option>
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <Code className="w-4 h-4" />
                Code
              </label>
              <div className="rounded-xl overflow-hidden border border-emerald-500/30 shadow-lg" style={{ height: '450px' }}>
                <Editor
                  height="100%"
                  language={getMonacoLanguage(language)}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                    padding: { top: 12, bottom: 12 },
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                  }}
                />
              </div>
            </div>
            {activeFeature === 'debug' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                  <FileText className="w-4 h-4" />
                  Context (Optional)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., sorting algorithm"
                  className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all backdrop-blur-sm hover:bg-white/10"
                />
              </div>
            )}
          </div>
        );
      
      case 'convert':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <Languages className="w-4 h-4" />
                Target Language
              </label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all backdrop-blur-sm appearance-none cursor-pointer hover:bg-white/10"
                >
                  <option value="python" className="bg-slate-800">Python</option>
                  <option value="javascript" className="bg-slate-800">JavaScript</option>
                  <option value="typescript" className="bg-slate-800">TypeScript</option>
                  <option value="java" className="bg-slate-800">Java</option>
                  <option value="cpp" className="bg-slate-800">C++</option>
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <FileText className="w-4 h-4" />
                Logic/Pseudo-code
              </label>
              <div className="rounded-xl overflow-hidden border border-emerald-500/30 shadow-lg" style={{ height: '450px' }}>
                <Editor
                  height="100%"
                  language="plaintext"
                  value={logic}
                  onChange={(value) => setLogic(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                    padding: { top: 12, bottom: 12 },
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                  }}
                />
              </div>
            </div>
          </div>
        );
      
      case 'snippets':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <Languages className="w-4 h-4" />
                Programming Language
              </label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all backdrop-blur-sm appearance-none cursor-pointer hover:bg-white/10"
                >
                  <option value="python" className="bg-slate-800">Python</option>
                  <option value="javascript" className="bg-slate-800">JavaScript</option>
                  <option value="typescript" className="bg-slate-800">TypeScript</option>
                  <option value="java" className="bg-slate-800">Java</option>
                  <option value="cpp" className="bg-slate-800">C++</option>
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <BookOpen className="w-4 h-4" />
                Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., file handling, API calls, data structures"
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all backdrop-blur-sm hover:bg-white/10"
              />
            </div>
          </div>
        );
      
      case 'projects':
      case 'roadmaps':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <GraduationCap className="w-4 h-4" />
                Level
              </label>
              <div className="relative">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all backdrop-blur-sm appearance-none cursor-pointer hover:bg-white/10"
                >
                  <option value="Beginner" className="bg-slate-800">Beginner</option>
                  <option value="Intermediate" className="bg-slate-800">Intermediate</option>
                  <option value="Advanced" className="bg-slate-800">Advanced</option>
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <BookOpen className="w-4 h-4" />
                Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={activeFeature === 'projects' ? 'e.g., web development, machine learning' : 'e.g., full-stack development, data science'}
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all backdrop-blur-sm hover:bg-white/10"
              />
            </div>
          </div>
        );
      
      case 'playground':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <Languages className="w-4 h-4" />
                Programming Language
              </label>
              <div className="relative">
                <select
                  value={playgroundLanguage}
                  onChange={(e) => setPlaygroundLanguage(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all backdrop-blur-sm appearance-none cursor-pointer hover:bg-white/10"
                >
                  {supportedLanguages.length > 0 ? (
                    supportedLanguages.map((lang) => (
                      <option key={lang} value={lang} className="bg-slate-800">
                        {lang}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Python" className="bg-slate-800">Python</option>
                      <option value="JavaScript" className="bg-slate-800">JavaScript</option>
                      <option value="TypeScript" className="bg-slate-800">TypeScript</option>
                      <option value="Java" className="bg-slate-800">Java</option>
                      <option value="C++" className="bg-slate-800">C++</option>
                      <option value="C" className="bg-slate-800">C</option>
                      <option value="Go" className="bg-slate-800">Go</option>
                      <option value="Rust" className="bg-slate-800">Rust</option>
                    </>
                  )}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <Code className="w-4 h-4" />
                Code
              </label>
              <div className="rounded-xl overflow-hidden border border-emerald-500/30 shadow-lg" style={{ height: '500px' }}>
                <Editor
                  height="100%"
                  language={getMonacoLanguage(playgroundLanguage)}
                  value={playgroundCode}
                  onChange={(value) => setPlaygroundCode(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                    padding: { top: 12, bottom: 12 },
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <FileText className="w-4 h-4" />
                Standard Input
                <span className="text-xs font-normal text-yellow-400 ml-2">(Required if your code uses input())</span>
              </label>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-2">
                <p className="text-xs text-blue-300">
                  <strong>When to use:</strong> If your code uses <code className="bg-blue-900/30 px-1 rounded">input()</code>, <code className="bg-blue-900/30 px-1 rounded">scanf()</code>, <code className="bg-blue-900/30 px-1 rounded">readline()</code>, or similar functions that read from stdin, enter the input values here (one per line or space-separated).
                </p>
              </div>
              <textarea
                value={playgroundStdin}
                onChange={(e) => setPlaygroundStdin(e.target.value)}
                placeholder="Example for Python:&#10;5&#10;10&#10;&#10;Example for C++:&#10;5 10&#10;&#10;Example for multiple inputs:&#10;value1&#10;value2&#10;value3"
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all backdrop-blur-sm font-mono text-sm resize-none hover:bg-white/10"
              />
              <p className="text-xs text-gray-400">
                💡 Tip: For programs that read multiple values, enter each value on a new line or space-separated depending on your code's input format.
              </p>
            </div>
          </div>
        );
      
      case 'collaborate':
        return null; // Collaborative room handles its own UI
      
      default:
        return null;
    }
  };

  // Special rendering for collaborative room feature
  if (activeFeature === 'collaborate') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950">
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 opacity-95"
          aria-hidden="true"
        />
        <Snowfall
          snowflakeCount={220}
          color="#e0f2ff"
          speed={snowSpeed}
          wind={snowWind}
          radius={snowRadius}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10,
            pointerEvents: 'none',
            opacity: 0.28,
            mixBlendMode: 'screen',
          }}
        />
        <div className="min-h-screen flex flex-col relative z-20">
          <div className="flex-1 flex flex-col container mx-auto px-4 py-4 w-full max-w-[1920px]">
            {/* Header */}
            <div className="text-center mb-4 flex-shrink-0">
              <h1 className="text-4xl font-bold text-white mb-1">KodesCRUxxx</h1>
              <p className="text-lg text-gray-300">AI-Powered Coding Assistant</p>
              {backendConnected === false && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 backdrop-blur-sm text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span>
                    Backend not connected. Please start the backend server: <code className="bg-red-900/30 px-1.5 py-0.5 rounded">uvicorn main:app --reload</code>
                  </span>
                </div>
              )}
              {backendConnected === true && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 backdrop-blur-sm text-xs">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Backend connected</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 space-y-1.5">
                  {features.map((feature) => {
                    const Icon = feature.icon;
                    const isActive = activeFeature === feature.id;
                    return (
                      <button
                        key={feature.id}
                        onClick={() => {
                          setActiveFeature(feature.id);
                          setResponse('');
                          setError('');
                          setExecutionResult(null);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm ${
                          isActive
                            ? 'bg-white/20 text-white shadow-lg'
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="font-medium">{feature.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Content - Collaborative Room */}
              <div className="lg:col-span-4">
                <CollaborativeRoom />
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <footer className="mt-auto border-t border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-6">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
                <span>Created by</span>
                <span className="font-semibold text-white">Palak Soni</span>
                <a
                  href="https://www.linkedin.com/in/palak-soni-292280288/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                  aria-label="Palak Soni's LinkedIn"
                >
                  <Linkedin size={18} className="inline" />
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  // Regular features rendering
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 opacity-95"
        aria-hidden="true"
      />
      <Snowfall
        snowflakeCount={160}
        color="#e0f2ff"
        speed={snowSpeed}
        wind={snowWind}
        radius={snowRadius}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
          pointerEvents: 'none',
          opacity: 0.28,
          mixBlendMode: 'screen',
        }}
      />
      <div className="min-h-screen flex flex-col relative z-20">
        <div className="flex-1 flex flex-col container mx-auto px-4 py-4 w-full max-w-[1920px]">
          {/* Header */}
          <div className="text-center mb-4 flex-shrink-0">
            <h1 className="text-4xl font-bold text-white mb-1">KodesCRUxxx</h1>
            <p className="text-lg text-gray-300">AI-Powered Coding Assistant</p>
            {backendConnected === false && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 backdrop-blur-sm text-xs">
                <AlertCircle className="w-3 h-3" />
                <span>
                  Backend not connected. Please start the backend server: <code className="bg-red-900/30 px-1.5 py-0.5 rounded">uvicorn main:app --reload</code>
                </span>
              </div>
            )}
            {backendConnected === true && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 backdrop-blur-sm text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Backend connected</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 space-y-1.5">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  const isActive = activeFeature === feature.id;
                  return (
                    <button
                      key={feature.id}
                      onClick={() => {
                        setActiveFeature(feature.id);
                        setResponse('');
                        setError('');
                        setExecutionResult(null);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm ${
                        isActive
                          ? 'bg-white/20 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="font-medium">{feature.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-4">
              <div className="space-y-4 pb-8">
                {/* Feature Card */}
                <div
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 flex flex-col"
                  style={featureBackgroundStyle}
                >
                  <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                    {(() => {
                      const feature = features.find(f => f.id === activeFeature);
                      const Icon = feature?.icon || Code2;
                      return (
                        <>
                          <div className="p-2 bg-white/10 rounded-lg">
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <h2 className="text-2xl font-bold text-white">
                            {feature?.label}
                          </h2>
                        </>
                      );
                    })()}
                  </div>
                  
                  <div className="mb-4">
                    {renderForm()}
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading && activeFeature === 'playground'}
                    className="w-full bg-gradient-to-r from-indigo-600 via-emerald-600 to-cyan-600 text-white py-3 rounded-xl font-semibold text-base hover:from-indigo-700 hover:via-emerald-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/70 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 flex-shrink-0"
                  >
                    {loading && activeFeature === 'playground' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        {activeFeature === 'playground' ? (
                          <>
                            <Play className="w-5 h-5" />
                            <span>Run Code</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            <span>Submit</span>
                          </>
                        )}
                      </>
                    )}
                  </button>

                  {error && (
                    <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 backdrop-blur-sm flex-shrink-0">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold mb-1 text-sm">Error</p>
                          <p className="text-xs">{error}</p>
                          {error.includes('Cannot connect to backend') && (
                            <div className="mt-2 p-2 bg-red-900/30 rounded-lg text-xs">
                              <p className="font-semibold mb-1">To fix this:</p>
                              <ol className="list-decimal list-inside space-y-1">
                                <li>Open a terminal in the project root</li>
                                <li>Run: <code className="bg-red-950/50 px-1 py-0.5 rounded">uvicorn main:app --reload --host 0.0.0.0 --port 8000</code></li>
                                <li>Wait for the server to start, then try again</li>
                              </ol>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Execution Result Card (Playground) */}
                {activeFeature === 'playground' && executionResult && (
                  <div
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 shadow-2xl border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col min-h-0"
                    style={featureBackgroundStyle}
                  >
                    <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                      {executionResult.success ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <h3 className="text-lg font-bold text-white">
                        {executionResult.success ? 'Execution Successful' : 'Execution Failed'}
                      </h3>
                    </div>
                    <div className="space-y-3 custom-scrollbar pr-2" style={{ overflowY: 'auto', maxHeight: '400px' }}>
                      {executionResult.output && (
                        <div>
                          <label className="text-sm font-semibold text-gray-300 mb-2 block">Output</label>
                          <div className="bg-slate-900/70 rounded-xl p-4 border border-white/10">
                            <pre className="text-green-300 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
                              {executionResult.output}
                            </pre>
                          </div>
                        </div>
                      )}
                      {executionResult.error && (
                        <div>
                          <label className="text-sm font-semibold text-red-300 mb-2 block">Error</label>
                          <div className="bg-red-900/30 rounded-xl p-4 border border-red-500/30">
                            <pre className="text-red-300 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
                              {executionResult.error}
                            </pre>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-4 text-xs text-gray-400">
                        {executionResult.language && (
                          <span>Language: <span className="text-white">{executionResult.language}</span></span>
                        )}
                        {executionResult.exit_code !== undefined && (
                          <span>Exit Code: <span className="text-white">{executionResult.exit_code}</span></span>
                        )}
                        {executionResult.version && (
                          <span>Version: <span className="text-white">{executionResult.version}</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Response Card (Other Features) */}
                {activeFeature !== 'playground' && (response || loading) && (
                  <div
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 shadow-2xl border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col"
                    style={featureBackgroundStyle}
                  >
                    <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                      {loading ? (
                        <>
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                          <h3 className="text-lg font-bold text-white">Generating...</h3>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <h3 className="text-lg font-bold text-white">Response</h3>
                        </>
                      )}
                    </div>
                    <div className="bg-slate-900/70 rounded-xl p-5 border border-white/10 custom-scrollbar markdown-content" style={{ overflowY: 'auto', maxHeight: '600px' }}>
                      {response ? (
                        <ReactMarkdown
                          components={{
                          code({ inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            const language = match ? match[1] : '';
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={language}
                                PreTag="div"
                                className="rounded-lg"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className="bg-slate-800/50 px-1.5 py-0.5 rounded text-pink-300 text-sm" {...props}>
                                {children}
                              </code>
                            );
                          },
                          h1: ({ children }) => <h1 className="text-3xl font-bold text-white mt-8 mb-6 pb-3 border-b border-white/20">{children}</h1>,
                          h2: ({ children }) => {
                            const text = String(children);
                            const isComplexity = text.includes('Complexity') || text.includes('Time') || text.includes('Space');
                            return (
                              <div className="mt-6 mb-4">
                                <h2 className={`text-2xl font-bold ${isComplexity ? 'text-emerald-300' : 'text-white'} mt-6 mb-4 flex items-center gap-2`}>
                                  {isComplexity && <BarChart3 className="w-6 h-6" />}
                                  {children}
                                </h2>
                                {isComplexity && <div className="h-1 w-20 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></div>}
                              </div>
                            );
                          },
                          h3: ({ children }) => {
                            const text = String(children);
                            const isImportant = text.includes('Complexity') || text.includes('Optimization') || text.includes('Summary') || text.includes('Best');
                            return (
                              <h3 className={`text-xl font-semibold ${isImportant ? 'text-cyan-300' : 'text-white'} mt-5 mb-3 flex items-center gap-2`}>
                                {isImportant && <Sparkles className="w-5 h-5" />}
                                {children}
                              </h3>
                            );
                          },
                          h4: ({ children }) => <h4 className="text-lg font-semibold text-gray-200 mt-4 mb-2">{children}</h4>,
                          p: ({ children }) => {
                            const text = String(children);
                            const hasComplexity = /O\([^)]+\)/.test(text);
                            if (hasComplexity) {
                              return (
                                <div className="bg-emerald-500/20 border-l-4 border-emerald-400 rounded-r-lg p-4 my-4">
                                  <p className="text-emerald-100 mb-0 leading-relaxed font-mono text-base">
                                    {children}
                                  </p>
                                </div>
                              );
                            }
                            return <p className="text-gray-200 mb-3 leading-relaxed">{children}</p>;
                          },
                          ul: ({ children }) => <ul className="list-disc list-inside text-gray-200 mb-4 space-y-2 ml-6">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside text-gray-200 mb-4 space-y-2 ml-6">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-200">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-emerald-500 pl-4 my-3 text-gray-300 italic">
                              {children}
                            </blockquote>
                          ),
                          a: ({ href, children }) => (
                            <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {response}
                      </ReactMarkdown>
                      ) : (
                        <div className="text-gray-400 text-sm italic">
                          Waiting for response...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
              <span>Created by</span>
              <span className="font-semibold text-white">Palak Soni</span>
              <a
                href="https://www.linkedin.com/in/palak-soni-292280288/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
                aria-label="Palak Soni's LinkedIn"
              >
                <Linkedin size={18} className="inline" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;