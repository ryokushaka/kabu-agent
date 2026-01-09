/**
 * Enhanced API Client with authentication, error handling, and timeout support
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT = 10000; // 10 seconds

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestConfig extends RequestInit {
  timeout?: number;
  requiresAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      timeout = DEFAULT_TIMEOUT,
      requiresAuth = true,
      headers = {},
      ...restConfig
    } = config;

    const token = this.getAuthToken();

    // Build headers
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers
    };

    if (requiresAuth && token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...restConfig,
        headers: requestHeaders,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.location.href = '/#/login';
        throw new ApiError('Session expired. Please login again.', 401);
      }

      // Handle other error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: 'Unknown error occurred'
        }));
        throw new ApiError(
          errorData.detail || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }

      return response.text() as unknown as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('Request timeout. Please try again.', 408);
      }

      // Re-throw ApiError
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error occurred',
        0
      );
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'GET'
    });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE'
    });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
