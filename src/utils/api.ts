import type { APIResponse } from '@types';

class ApiClient {
  private baseURL: string;
  private isLiveConnection: boolean;

  constructor(baseURL?: string) {
    // Detect if we're connecting to live server via port forwarding
    this.isLiveConnection = window.location.port === '3001' || import.meta.env.NODE_ENV === 'production';
    
    if (baseURL) {
      this.baseURL = baseURL;
    } else if (this.isLiveConnection) {
      // Use port-forwarded API for live connection
      this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    } else {
      // Use local development API
      this.baseURL = '/api';
    }
    
    console.log(`🔗 API Client initialized: ${this.baseURL} (Live: ${this.isLiveConnection})`);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Development/Demo mode - bypass API calls for frontend-only testing
    if (import.meta.env.DEV || window.location.port === '4173') {
      return this.mockResponse<T>(endpoint, options);
    }
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session management
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private mockResponse<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (endpoint === '/auth/login') {
          const body = options.body ? JSON.parse(options.body as string) : {};
          if (body.username && body.password) {
            resolve({
              success: true,
              data: {
                operative: {
                  id: 'demo-operative',
                  name: body.username,
                  role: 'investigator',
                  clearanceLevel: 'alpha',
                  department: 'digital-forensics',
                  status: 'active'
                }
              } as any
            });
          } else {
            resolve({
              success: false,
              error: 'Invalid credentials'
            });
          }
        } else if (endpoint === '/auth/session') {
          resolve({
            success: false,
            error: 'No active session'
          });
        } else {
          resolve({
            success: true,
            data: {} as T
          });
        }
      }, 500); // Simulate network delay
    });
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<APIResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return this.request<T>(url, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();