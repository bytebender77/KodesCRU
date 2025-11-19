import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Users, MessageSquare, Send, Plus, LogOut, Copy, CheckCircle, AlertCircle, Wifi, WifiOff, Play, X, Mic, MicOff, Volume2, Terminal } from 'lucide-react';
import { wsService, Room, RoomUser } from '../services/websocket';
import { apiService } from '../services/api';

interface ChatMessage {
  user: RoomUser;
  message: string;
  timestamp: string;
}

export default function CollaborativeRoom() {
  const [view, setView] = useState<'lobby' | 'room'>('lobby');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  // Room creation/joining states
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [roomLanguage, setRoomLanguage] = useState('Python');
  const [initialCode, setInitialCode] = useState('');
  const [roomIdToJoin, setRoomIdToJoin] = useState('');

  // Room states
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<RoomUser | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('Python');
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Voice chat states
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Code execution states
  const [stdin, setStdin] = useState('');
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const codeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Define addChatMessage first so it can be used in callbacks
  const addChatMessage = useCallback((msg: ChatMessage) => {
    setChatMessages((prev) => [...prev, msg]);
  }, []);

  const handleJoined = useCallback((message: any) => {
    console.log('Received joined message:', message);
    if (message.user && message.room) {
      setCurrentUser(message.user);
      setCurrentRoom(message.room);
      setCode(message.room.code || '');
      setLanguage(message.room.language || 'Python');
      setUsers(message.room.users || []);
      setConnected(true);
      setView('room');
      setLoading(false);
      setError(''); // Clear any previous errors
    } else {
      console.error('Invalid joined message:', message);
      setError('Invalid response from server');
      setLoading(false);
    }
  }, []);

  const handleUserJoined = useCallback((message: any) => {
    setUsers((prev) => {
      // Check if user already exists
      if (prev.some(u => u.id === message.user.id)) {
        return prev;
      }
      return [...prev, message.user];
    });
    addChatMessage({
      user: message.user,
      message: `${message.user.name} joined the room`,
      timestamp: new Date().toISOString(),
    });
  }, [addChatMessage]);

  const handleUserLeft = useCallback((message: any) => {
    setUsers((prev) => prev.filter((u) => u.id !== message.user.id));
    addChatMessage({
      user: message.user,
      message: `${message.user.name} left the room`,
      timestamp: new Date().toISOString(),
    });
  }, [addChatMessage]);

  const handleCodeChanged = useCallback((message: any) => {
    if (message.code !== undefined) {
      setCode(message.code);
    }
  }, []);

  const handleLanguageChanged = useCallback((message: any) => {
    if (message.language) {
      setLanguage(message.language);
    }
  }, []);

  const handleChatMessage = useCallback((message: any) => {
    addChatMessage({
      user: message.user,
      message: message.message,
      timestamp: message.timestamp || new Date().toISOString(),
    });
  }, [addChatMessage]);

  const handleVoiceAudio = useCallback((message: any) => {
    // Play received audio
    if (message.audio_data && isVoiceEnabled) {
      try {
        const audioBlob = new Blob([Uint8Array.from(atob(message.audio_data), c => c.charCodeAt(0))], { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play().catch(err => console.error('Error playing audio:', err));
        audio.onended = () => URL.revokeObjectURL(audioUrl);
      } catch (err) {
        console.error('Error processing voice audio:', err);
      }
    }
  }, [isVoiceEnabled]);

  const handleExecutionResult = useCallback((message: any) => {
    if (message.result) {
      setExecutionResult(message.result);
      setIsExecuting(false);
    }
  }, []);

  const handleError = useCallback((message: any) => {
    const errorMsg = message.message || 'An error occurred';
    setError(errorMsg);
    setLoading(false);
    
    if (errorMsg.includes('Failed to join') || errorMsg.includes('Room') || errorMsg.includes('not found')) {
      // Disconnect and return to lobby
      wsService.disconnect();
      setTimeout(() => {
        setView('lobby');
        setConnected(false);
        setCurrentRoom(null);
        setCurrentUser(null);
      }, 2000);
    }
  }, []);

  // Load rooms on mount
  const loadRooms = async () => {
    try {
      const result = await apiService.listRooms();
      if (result.success) {
        setRooms(result.rooms);
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    }
  };

  // Setup WebSocket handlers - always register them so they work during connection
  useEffect(() => {
    try {
      // Register all handlers
      wsService.on('joined', handleJoined);
      wsService.on('user_joined', handleUserJoined);
      wsService.on('user_left', handleUserLeft);
      wsService.on('code_changed', handleCodeChanged);
      wsService.on('language_changed', handleLanguageChanged);
      wsService.on('chat_message', handleChatMessage);
      wsService.on('voice_audio', handleVoiceAudio);
      wsService.on('execution_result', handleExecutionResult);
      wsService.on('error', handleError);

      // Cleanup on unmount
      return () => {
        try {
          wsService.off('joined', handleJoined);
          wsService.off('user_joined', handleUserJoined);
          wsService.off('user_left', handleUserLeft);
          wsService.off('code_changed', handleCodeChanged);
          wsService.off('language_changed', handleLanguageChanged);
          wsService.off('chat_message', handleChatMessage);
          wsService.off('voice_audio', handleVoiceAudio);
          wsService.off('execution_result', handleExecutionResult);
          wsService.off('error', handleError);
        } catch (err) {
          console.error('Error cleaning up WebSocket handlers:', err);
        }
      };
    } catch (err) {
      console.error('Error setting up WebSocket handlers:', err);
    }
  }, [handleJoined, handleUserJoined, handleUserLeft, handleCodeChanged, handleLanguageChanged, handleChatMessage, handleVoiceAudio, handleExecutionResult, handleError]);

  // Load rooms on mount
  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const createRoom = async () => {
    if (!roomName.trim() || !userName.trim()) {
      setError('Please enter room name and your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await apiService.createRoom({
        name: roomName,
        host_name: userName,
        language: roomLanguage,
        code: initialCode,
        max_users: 10,
        is_public: true,
      });

      if (result.success) {
        await joinRoom(result.room.id, userName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId: string, name: string) => {
    setLoading(true);
    setError('');

    try {
      // First verify room exists
      try {
        const roomInfo = await apiService.getRoom(roomId);
        if (!roomInfo.success || !roomInfo.room) {
          setError('Room not found');
          setLoading(false);
          return;
        }
        console.log('Room verified:', roomInfo.room);
      } catch (err) {
        console.error('Room verification error:', err);
        setError('Room not found. Please check the room ID.');
        setLoading(false);
        return;
      }

      // Connect via WebSocket
      console.log('Connecting to WebSocket for room:', roomId, 'as user:', name);
      await wsService.connect(roomId, name);
      console.log('WebSocket connection established, waiting for joined message...');
      // Don't set view here - wait for 'joined' message
      // The handleJoined function will set the view to 'room'
    } catch (err) {
      console.error('Join room error:', err);
      setError(err instanceof Error ? err.message : 'Failed to join room');
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomIdToJoin.trim() || !userName.trim()) {
      setError('Please enter room ID and your name');
      return;
    }
    await joinRoom(roomIdToJoin, userName);
  };

  const leaveRoom = () => {
    // Stop voice recording if active
    if (isRecording && mediaRecorderRef.current) {
      stopVoiceRecording();
    }
    setIsVoiceEnabled(false);
    
    wsService.disconnect();
    setView('lobby');
    setCurrentRoom(null);
    setCurrentUser(null);
    setCode('');
    setUsers([]);
    setChatMessages([]);
    setConnected(false);
    setExecutionResult(null);
    setStdin('');
    loadRooms();
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);

    // Debounce code changes
    if (codeChangeTimeoutRef.current) {
      clearTimeout(codeChangeTimeoutRef.current);
    }

    codeChangeTimeoutRef.current = setTimeout(() => {
      if (currentRoom) {
        wsService.send({
          type: 'code_change',
          room_id: currentRoom.id,
          code: newCode,
        });
      }
    }, 500);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (currentRoom) {
      wsService.send({
        type: 'language_change',
        room_id: currentRoom.id,
        language: newLanguage,
      });
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !currentRoom) return;

    wsService.send({
      type: 'chat_message',
      room_id: currentRoom.id,
      message: chatInput,
    });

    setChatInput('');
  };

  const copyRoomId = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Voice chat functions
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          
          // Send audio chunk via WebSocket
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            const audioData = base64Audio.split(',')[1]; // Remove data URL prefix
            
            if (currentRoom) {
              wsService.send({
                type: 'voice_audio',
                room_id: currentRoom.id,
                audio_data: audioData,
              });
            }
          };
          reader.readAsDataURL(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Send chunks every 100ms
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting voice recording:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleVoiceChat = async () => {
    if (!isVoiceEnabled) {
      // Enable voice chat and start recording
      setIsVoiceEnabled(true);
      try {
        await startVoiceRecording();
      } catch (err) {
        setIsVoiceEnabled(false);
        setError('Failed to access microphone. Please check permissions.');
      }
    } else if (isRecording) {
      // Stop recording but keep voice enabled
      stopVoiceRecording();
    } else {
      // Start recording if voice is enabled but not recording
      try {
        await startVoiceRecording();
      } catch (err) {
        setError('Failed to access microphone. Please check permissions.');
      }
    }
  };

  const disableVoiceChat = () => {
    if (isRecording) {
      stopVoiceRecording();
    }
    setIsVoiceEnabled(false);
  };

  // Code execution function
  const executeCode = async () => {
    if (!code.trim() || !currentRoom) {
      setError('Please enter code to execute');
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      // Execute code via API
      const result = await apiService.executeCode(code, language, stdin);
      setExecutionResult(result);

      // Broadcast execution result to room
      if (currentRoom) {
        wsService.send({
          type: 'execute_code',
          room_id: currentRoom.id,
          result: result,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute code');
      setIsExecuting(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isRecording]);

  const getMonacoLanguage = (lang: string): string => {
    const langMap: { [key: string]: string } = {
      'Python': 'python',
      'JavaScript': 'javascript',
      'TypeScript': 'typescript',
      'Java': 'java',
      'C++': 'cpp',
      'C': 'c',
      'Go': 'go',
      'Rust': 'rust',
      'PHP': 'php',
    };
    return langMap[lang] || 'plaintext';
  };

  if (view === 'lobby') {
    return (
      <div className="space-y-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Collaborative Rooms
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 backdrop-blur-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Room */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Room
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-1">Room Name</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Enter room name"
                    className="w-full px-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-1">Language</label>
                  <select
                    value={roomLanguage}
                    onChange={(e) => setRoomLanguage(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Python">Python</option>
                    <option value="JavaScript">JavaScript</option>
                    <option value="TypeScript">TypeScript</option>
                    <option value="Java">Java</option>
                    <option value="C++">C++</option>
                    <option value="Go">Go</option>
                    <option value="Rust">Rust</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-1">Initial Code (Optional)</label>
                  <textarea
                    value={initialCode}
                    onChange={(e) => setInitialCode(e.target.value)}
                    placeholder="Enter initial code..."
                    rows={4}
                    className="w-full px-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                  />
                </div>
                <button
                  onClick={createRoom}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </div>

            {/* Join Room */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Join Room
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-1">Room ID</label>
                  <input
                    type="text"
                    value={roomIdToJoin}
                    onChange={(e) => setRoomIdToJoin(e.target.value)}
                    placeholder="Enter room ID"
                    className="w-full px-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <button
                  onClick={handleJoinRoom}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            </div>
          </div>

          {/* Public Rooms List */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-white mb-4">Public Rooms</h3>
            {rooms.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No public rooms available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
                    onClick={() => {
                      setRoomIdToJoin(room.id);
                      if (userName.trim()) {
                        handleJoinRoom();
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white">{room.name}</h4>
                      <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded">
                        {room.user_count}/{room.max_users}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">Language: {room.language}</p>
                    <p className="text-xs text-gray-500 font-mono">ID: {room.id}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Room Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-white/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">{currentRoom?.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {connected ? (
                  <div className="flex items-center gap-1 text-green-400 text-sm">
                    <Wifi className="w-4 h-4" />
                    <span>Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-400 text-sm">
                    <WifiOff className="w-4 h-4" />
                    <span>Disconnected</span>
                  </div>
                )}
                <span className="text-gray-400 text-sm">•</span>
                <span className="text-gray-300 text-sm">Room ID: {currentRoom?.id}</span>
                <button
                  onClick={copyRoomId}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                  title="Copy Room ID"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={leaveRoom}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Leave Room
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Code Editor */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-200">Language:</label>
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Python">Python</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="Java">Java</option>
                  <option value="C++">C++</option>
                  <option value="Go">Go</option>
                  <option value="Rust">Rust</option>
                </select>
              </div>
              <button
                onClick={executeCode}
                disabled={isExecuting || !code.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                {isExecuting ? 'Running...' : 'Run Code'}
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-emerald-500/30" style={{ height: '400px' }}>
              <Editor
                height="100%"
                language={getMonacoLanguage(language)}
                value={code}
                onChange={handleCodeChange}
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
                }}
              />
            </div>
          </div>

          {/* Input/Output Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Input (stdin)</h3>
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Enter input for your code (e.g., for Python input() function)..."
                rows={8}
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-slate-900/70 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm resize-none"
              />
              <p className="text-xs text-gray-400 mt-2">
                💡 Enter values line by line or space-separated depending on your code
              </p>
            </div>

            {/* Output Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Output</h3>
              </div>
              <div className="bg-slate-900/70 rounded-xl p-4 border border-white/10 min-h-[200px] max-h-[300px] overflow-y-auto">
                {isExecuting ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Executing code...</span>
                  </div>
                ) : executionResult ? (
                  <div className="space-y-3">
                    {executionResult.success ? (
                      <>
                        {executionResult.output && (
                          <div>
                            <p className="text-xs font-semibold text-green-400 mb-1">Output:</p>
                            <pre className="text-green-300 font-mono text-sm whitespace-pre-wrap">
                              {executionResult.output}
                            </pre>
                          </div>
                        )}
                        {executionResult.error && (
                          <div>
                            <p className="text-xs font-semibold text-yellow-400 mb-1">Warning:</p>
                            <pre className="text-yellow-300 font-mono text-sm whitespace-pre-wrap">
                              {executionResult.error}
                            </pre>
                          </div>
                        )}
                        <div className="flex gap-4 text-xs text-gray-400 pt-2 border-t border-white/10">
                          <span>Exit Code: <span className="text-white">{executionResult.exit_code ?? 0}</span></span>
                          {executionResult.version && (
                            <span>Version: <span className="text-white">{executionResult.version}</span></span>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        {executionResult.error && (
                          <div>
                            <p className="text-xs font-semibold text-red-400 mb-1">Error:</p>
                            <pre className="text-red-300 font-mono text-sm whitespace-pre-wrap">
                              {executionResult.error}
                            </pre>
                          </div>
                        )}
                        {executionResult.output && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 mb-1">Output:</p>
                            <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
                              {executionResult.output}
                            </pre>
                          </div>
                        )}
                        <div className="flex gap-4 text-xs text-gray-400 pt-2 border-t border-white/10">
                          <span>Exit Code: <span className="text-white">{executionResult.exit_code ?? 1}</span></span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Output will appear here after code execution...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Users List */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({users.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: user.color }}
                  />
                  <span className="text-sm text-white flex-1">{user.name}</span>
                  {user.is_host && (
                    <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                      Host
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-white/20 flex flex-col" style={{ height: '350px' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chat
              </h3>
              <button
                onClick={toggleVoiceChat}
                className={`p-2 rounded-lg transition-all ${
                  isVoiceEnabled
                    ? isRecording
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                    : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                }`}
                title={isVoiceEnabled ? (isRecording ? 'Stop Recording' : 'Start Recording') : 'Enable Voice Chat'}
              >
                {isRecording ? (
                  <Mic className="w-4 h-4 animate-pulse" />
                ) : isVoiceEnabled ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>
            {isVoiceEnabled && (
              <div className="mb-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-emerald-300 flex items-center gap-2">
                    {isRecording ? (
                      <>
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                        Recording... Click mic to stop
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        Voice enabled. Click mic to start recording
                      </>
                    )}
                  </p>
                  <button
                    onClick={disableVoiceChat}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    title="Disable Voice Chat"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-2">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: msg.user.color }}
                    />
                    <span className="font-semibold text-white">{msg.user.name}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-300 ml-4">{msg.message}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={sendChatMessage}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

