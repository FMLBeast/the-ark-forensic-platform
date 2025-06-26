import { api } from '@utils/api';

export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  timestamp: string;
  message_type: 'text' | 'file_annotation' | 'agent_insight' | 'system';
  metadata?: {
    file_path?: string;
    annotation_id?: string;
    agent_id?: string;
    coordinates?: { x: number; y: number; width: number; height: number };
  };
}

export interface ChatUser {
  user_id: string;
  username: string;
  role: 'analyst' | 'puzzler' | 'admin';
  status: 'online' | 'away' | 'offline';
  last_activity: string;
  avatar_color: string;
}

export interface ChatRoom {
  room_id: string;
  name: string;
  description: string;
  participants: ChatUser[];
  message_count: number;
  created_at: string;
  last_message?: ChatMessage;
}

class ChatService {
  private baseURL: string;
  private websocket: WebSocket | null = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private userStatusCallbacks: ((users: ChatUser[]) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || '/api';
    // Only connect if not in demo mode
    if (import.meta.env.DEV && window.location.port !== '4173') {
      this.connectWebSocket();
    } else {
      console.log('💬 Chat Service: Demo mode - WebSocket disabled');
    }
  }

  private connectWebSocket() {
    const wsUrl = this.baseURL.replace('http', 'ws') + '/chat/ws';
    
    try {
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.onopen = () => {
        console.log('Chat WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message') {
            this.messageCallbacks.forEach(callback => callback(data.message));
          } else if (data.type === 'user_status') {
            this.userStatusCallbacks.forEach(callback => callback(data.users));
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('Chat WebSocket disconnected');
        this.attemptReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error('Chat WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect to chat WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      setTimeout(() => {
        console.log(`Attempting to reconnect chat WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connectWebSocket();
      }, delay);
    }
  }

  async getRooms(): Promise<ChatRoom[]> {
    try {
      const response = await api.get<{ rooms: ChatRoom[] }>('/chat/rooms');
      return response.data?.rooms || this.getMockRooms();
    } catch (error) {
      console.warn('Failed to fetch chat rooms, using mock data:', error);
      return this.getMockRooms();
    }
  }

  async getMessages(roomId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    try {
      const response = await api.get<{ messages: ChatMessage[] }>(`/chat/rooms/${roomId}/messages`, {
        params: { limit, offset }
      });
      return response.data?.messages || this.getMockMessages(roomId);
    } catch (error) {
      console.warn('Failed to fetch messages, using mock data:', error);
      return this.getMockMessages(roomId);
    }
  }

  async sendMessage(roomId: string, message: string, messageType: ChatMessage['message_type'] = 'text', metadata?: ChatMessage['metadata']): Promise<ChatMessage> {
    const newMessage: Partial<ChatMessage> = {
      message,
      message_type: messageType,
      metadata,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await api.post<ChatMessage>(`/chat/rooms/${roomId}/messages`, newMessage);
      return response.data || this.createMockMessage(newMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async getRoomUsers(roomId: string): Promise<ChatUser[]> {
    try {
      const response = await api.get<{ users: ChatUser[] }>(`/chat/rooms/${roomId}/users`);
      return response.data?.users || this.getMockUsers();
    } catch (error) {
      console.warn('Failed to fetch room users, using mock data:', error);
      return this.getMockUsers();
    }
  }

  onMessage(callback: (message: ChatMessage) => void) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  onUserStatusChange(callback: (users: ChatUser[]) => void) {
    this.userStatusCallbacks.push(callback);
    return () => {
      this.userStatusCallbacks = this.userStatusCallbacks.filter(cb => cb !== callback);
    };
  }

  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  // Mock data generators for development
  private getMockRooms(): ChatRoom[] {
    return [
      {
        room_id: 'general',
        name: 'General Discussion',
        description: 'Main discussion room for all participants',
        participants: this.getMockUsers(),
        message_count: 156,
        created_at: new Date().toISOString(),
        last_message: {
          id: 'msg_1',
          user_id: 'user_1',
          username: 'AnalystAlpha',
          message: 'Found some interesting patterns in the steganography analysis...',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          message_type: 'text'
        }
      },
      {
        room_id: 'annotations',
        name: 'File Annotations',
        description: 'Discussion about file markings and annotations',
        participants: this.getMockUsers().slice(0, 3),
        message_count: 89,
        created_at: new Date().toISOString(),
        last_message: {
          id: 'msg_2',
          user_id: 'user_2',
          username: 'PuzzlerBeta',
          message: 'Marked suspicious bytes at offset 0x1A3F',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          message_type: 'file_annotation'
        }
      },
      {
        room_id: 'agent_insights',
        name: 'Agent Insights',
        description: 'AI agent discoveries and collaborative analysis',
        participants: this.getMockUsers(),
        message_count: 234,
        created_at: new Date().toISOString(),
        last_message: {
          id: 'msg_3',
          user_id: 'agent_intelligence',
          username: 'Intelligence Agent',
          message: 'Detected correlation between 3 files with 94% confidence',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          message_type: 'agent_insight'
        }
      }
    ];
  }

  private getMockUsers(): ChatUser[] {
    const colors = ['#00ff41', '#ff6b00', '#ff0040', '#4000ff', '#ff00b4', '#00b4ff'];
    
    return [
      {
        user_id: 'user_1',
        username: 'AnalystAlpha',
        role: 'analyst',
        status: 'online',
        last_activity: new Date().toISOString(),
        avatar_color: colors[0]
      },
      {
        user_id: 'user_2',
        username: 'PuzzlerBeta',
        role: 'puzzler',
        status: 'online',
        last_activity: new Date(Date.now() - 180000).toISOString(),
        avatar_color: colors[1]
      },
      {
        user_id: 'user_3',
        username: 'CryptoGamma',
        role: 'analyst',
        status: 'away',
        last_activity: new Date(Date.now() - 900000).toISOString(),
        avatar_color: colors[2]
      },
      {
        user_id: 'user_4',
        username: 'ForensicDelta',
        role: 'admin',
        status: 'online',
        last_activity: new Date(Date.now() - 60000).toISOString(),
        avatar_color: colors[3]
      },
      {
        user_id: 'agent_intelligence',
        username: 'Intelligence Agent',
        role: 'analyst',
        status: 'online',
        last_activity: new Date().toISOString(),
        avatar_color: colors[4]
      }
    ];
  }

  private getMockMessages(roomId: string): ChatMessage[] {
    const users = this.getMockUsers();
    const messages: ChatMessage[] = [];

    if (roomId === 'general') {
      messages.push(
        {
          id: 'msg_1',
          user_id: users[0].user_id,
          username: users[0].username,
          message: 'Starting analysis on the new image file. Anyone want to collaborate?',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          message_type: 'text'
        },
        {
          id: 'msg_2',
          user_id: users[1].user_id,
          username: users[1].username,
          message: 'I\'m in! I\'ll focus on the metadata and EXIF data.',
          timestamp: new Date(Date.now() - 1740000).toISOString(),
          message_type: 'text'
        },
        {
          id: 'msg_3',
          user_id: users[4].user_id,
          username: users[4].username,
          message: 'Intelligence Agent detected unusual entropy patterns. Investigating steganography possibilities.',
          timestamp: new Date(Date.now() - 1680000).toISOString(),
          message_type: 'agent_insight',
          metadata: { agent_id: 'intelligence_agent' }
        }
      );
    } else if (roomId === 'annotations') {
      messages.push(
        {
          id: 'msg_4',
          user_id: users[1].user_id,
          username: users[1].username,
          message: 'Suspicious byte sequence detected',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          message_type: 'file_annotation',
          metadata: {
            file_path: '/extracted_files/image_001.jpg',
            coordinates: { x: 100, y: 200, width: 50, height: 20 },
            annotation_id: 'ann_1'
          }
        },
        {
          id: 'msg_5',
          user_id: users[0].user_id,
          username: users[0].username,
          message: 'Good catch! I see the same pattern at offset 0x2A4B',
          timestamp: new Date(Date.now() - 840000).toISOString(),
          message_type: 'text'
        }
      );
    }

    return messages;
  }

  private createMockMessage(partial: Partial<ChatMessage>): ChatMessage {
    return {
      id: `msg_${Date.now()}`,
      user_id: 'current_user',
      username: 'You',
      message: partial.message || '',
      timestamp: partial.timestamp || new Date().toISOString(),
      message_type: partial.message_type || 'text',
      metadata: partial.metadata
    };
  }
}

export const chatService = new ChatService();