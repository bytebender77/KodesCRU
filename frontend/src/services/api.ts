const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ApiRequest {
  language?: string;
  code?: string;
  topic?: string;
  level?: string;
  logic?: string;
  snippet?: string;
}

export interface ApiResponse {
  response: string;
}

export interface ExecuteCodeResponse {
  success: boolean;
  output: string;
  error?: string;
  language: string;
  stage?: string;
  exit_code?: number;
  version?: string;
}

class ApiService {
  private async request<T>(endpoint: string, data: ApiRequest): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please make sure the backend is running on port 8000.`);
      }
      throw error;
    }
  }

  private async streamRequest(
    endpoint: string,
    data: ApiRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let hasReceivedData = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.chunk) {
                hasReceivedData = true;
                onChunk(json.chunk);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.startsWith('data: ')) {
        try {
          const json = JSON.parse(buffer.slice(6));
          if (json.chunk) {
            hasReceivedData = true;
            onChunk(json.chunk);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }

      // If no data was received, the backend might be slow to start
      if (!hasReceivedData) {
        // This shouldn't happen, but handle gracefully
        onChunk('\n\n⚠️ No response received. Please try again.');
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please make sure the backend is running on port 8000.`);
      }
      throw error;
    }
  }

  async explainCode(language: string, topic: string, level: string, code?: string): Promise<string> {
    const result = await this.request<ApiResponse>('/explain', { language, topic, level, code });
    return result.response;
  }

  async debugCode(language: string, code: string, topic?: string): Promise<string> {
    const result = await this.request<ApiResponse>('/debug', { language, code, topic });
    return result.response;
  }

  async generateCode(language: string, topic: string, level: string): Promise<string> {
    const result = await this.request<ApiResponse>('/generate', { language, topic, level });
    return result.response;
  }

  async convertLogic(logic: string, language: string): Promise<string> {
    const result = await this.request<ApiResponse>('/convert_logic', { logic, language });
    return result.response;
  }

  async analyzeComplexity(code: string): Promise<string> {
    const result = await this.request<ApiResponse>('/analyze_complexity', { code });
    return result.response;
  }

  async traceCode(code: string, language: string): Promise<string> {
    const result = await this.request<ApiResponse>('/trace_code', { code, language });
    return result.response;
  }

  async getSnippets(language: string, topic: string): Promise<string> {
    const result = await this.request<ApiResponse>('/get_snippets', { language, snippet: topic });
    return result.response;
  }

  async getProjects(level: string, topic: string): Promise<string> {
    const result = await this.request<ApiResponse>('/get_projects', { level, topic });
    return result.response;
  }

  async getRoadmaps(level: string, topic: string): Promise<string> {
    const result = await this.request<ApiResponse>('/get_roadmaps', { level, topic });
    return result.response;
  }

  // Streaming versions
  async streamExplainCode(
    language: string,
    topic: string,
    level: string,
    code: string | undefined,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    await this.streamRequest('/stream/explain', { language, topic, level, code }, onChunk);
  }

  async streamDebugCode(
    language: string,
    code: string,
    topic: string | undefined,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    await this.streamRequest('/stream/debug', { language, code, topic }, onChunk);
  }

  async streamGenerateCode(
    language: string,
    topic: string,
    level: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    await this.streamRequest('/stream/generate', { language, topic, level }, onChunk);
  }

  async streamConvertLogic(
    logic: string,
    language: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    await this.streamRequest('/stream/convert_logic', { logic, language }, onChunk);
  }

  async streamAnalyzeComplexity(
    code: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    await this.streamRequest('/stream/analyze_complexity', { code }, onChunk);
  }

  async streamTraceCode(
    code: string,
    language: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    await this.streamRequest('/stream/trace_code', { code, language }, onChunk);
  }

  async streamGetSnippets(
    language: string,
    topic: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    await this.streamRequest('/stream/get_snippets', { language, snippet: topic }, onChunk);
  }

  async streamGetProjects(
    level: string,
    topic: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    await this.streamRequest('/stream/get_projects', { level, topic }, onChunk);
  }

  async streamGetRoadmaps(
    level: string,
    topic: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    await this.streamRequest('/stream/get_roadmaps', { level, topic }, onChunk);
  }

  async executeCode(code: string, language: string, stdin?: string): Promise<ExecuteCodeResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/execute_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          stdin: stdin || '',
          version: '*'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please make sure the backend is running on port 8000.`);
      }
      throw error;
    }
  }

  // Room management methods
  async createRoom(data: {
    name: string;
    host_name: string;
    language?: string;
    code?: string;
    max_users?: number;
    is_public?: boolean;
  }): Promise<{ success: boolean; room: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please make sure the backend is running on port 8000.`);
      }
      throw error;
    }
  }

  async getRoom(roomId: string): Promise<{ success: boolean; room: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please make sure the backend is running on port 8000.`);
      }
      throw error;
    }
  }

  async listRooms(): Promise<{ success: boolean; rooms: any[]; count: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please make sure the backend is running on port 8000.`);
      }
      throw error;
    }
  }

  async deleteRoom(roomId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please make sure the backend is running on port 8000.`);
      }
      throw error;
    }
  }
}

export const apiService = new ApiService();

