import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

class AuthService {
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username,
      password,
    });
    if (response.data.access_token) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    return response.data;
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }
}

export default new AuthService();
