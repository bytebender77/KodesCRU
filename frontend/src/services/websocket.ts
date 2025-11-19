// Determine WebSocket URL based on environment
const getWebSocketUrl = () => {
  const wsUrl = import.meta.env.VITE_WS_URL;
  if (wsUrl) {
    return wsUrl;
  }
  
  // Auto-detect based on API URL
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  if (apiUrl.startsWith('https://')) {
    // Production: use secure WebSocket
    return apiUrl.replace('https://', 'wss://');
  } else {
    // Development: use regular WebSocket
    return apiUrl.replace('http://', 'ws://');
  }
};

const WS_BASE_URL = getWebSocketUrl();

export interface WebSocketMessage {
  type: 'join' | 'leave' | 'code_change' | 'cursor_move' | 'language_change' | 'chat_message' | 'execute_code' | 'voice_audio';
  room_id?: string;
  user_name?: string;
  code?: string;
  position?: { line: number; column: number };
  language?: string;
  message?: string;
  audio_data?: string;
  result?: any;
}

export interface RoomUser {
  id: string;
  name: string;
  color: string;
  is_host: boolean;
  joined_at: string;
}

export interface Room {
  id: string;
  name: string;
  host_id: string;
  language: string;
  code: string;
  created_at: string;
  max_users: number;
  is_public: boolean;
  users: RoomUser[];
  user_count: number;
}

export type MessageHandler = (message: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private roomId: string | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(roomId: string, userName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${WS_BASE_URL}/ws/${roomId}`;
        this.ws = new WebSocket(wsUrl);
        this.roomId = roomId;

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          
          // Send join message
          this.send({
            type: 'join',
            room_id: roomId,
            user_name: userName,
          });
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          // Don't reject immediately - let onclose handle it
          // This allows error messages from server to be received
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected', event.code, event.reason);
          this.ws = null;
          
          // Only attempt to reconnect if it wasn't a normal closure or intentional disconnect
          // Code 1000 = normal closure, 1001 = going away
          if (event.code !== 1000 && event.code !== 1001 && this.roomId && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
              this.connect(roomId, userName).catch(console.error);
            }, this.reconnectDelay * this.reconnectAttempts);
          } else if (event.code === 1000 || event.code === 1001) {
            // Normal closure - don't try to reconnect
            this.roomId = null;
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.send({ type: 'leave' });
      this.ws.close();
      this.ws = null;
      this.roomId = null;
      this.messageHandlers.clear();
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  on(messageType: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  off(messageType: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private handleMessage(message: any) {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }
    
    // Also trigger 'message' handlers for all messages
    const allHandlers = this.messageHandlers.get('message');
    if (allHandlers) {
      allHandlers.forEach((handler) => handler(message));
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getRoomId(): string | null {
    return this.roomId;
  }
}

export const wsService = new WebSocketService();

