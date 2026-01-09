/**
 * Authentication API endpoints
 */
import { apiClient } from '@shared/api';
import type { LoginRequest, LoginResponse, User } from '@entities/user';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    return apiClient.post<LoginResponse>('/token', formData, {
      requiresAuth: false,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
  },

  getCurrentUser: (): Promise<User> =>
    apiClient.get<User>('/users/me'),

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },

  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  storeAuthData: (data: LoginResponse & { user?: User }) => {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('isAuthenticated', 'true');
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
  },
};
