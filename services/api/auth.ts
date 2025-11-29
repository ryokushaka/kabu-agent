/**
 * Authentication API endpoints
 */
import { apiClient } from './client';
import type { LoginRequest, LoginResponse } from '../../types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    // FastAPI expects form data for OAuth2PasswordRequestForm
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
    localStorage.removeItem('isAuthenticated');
  },

  getCurrentUser: () =>
    apiClient.get('/users/me'),

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  }
};
