/**
 * Authentication Hook
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import type { LoginRequest } from '../types';

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('isAuthenticated', 'true');
      queryClient.invalidateQueries();
      navigate('/');
    },
    onError: (error: Error) => {
      console.error('Login failed:', error);
    }
  });

  const logout = () => {
    authApi.logout();
    queryClient.clear();
    navigate('/login');
  };

  const isAuthenticated = authApi.isAuthenticated();

  return {
    login: loginMutation.mutate,
    logout,
    isAuthenticated,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error
  };
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['user', 'current'],
    queryFn: authApi.getCurrentUser,
    enabled: authApi.isAuthenticated(),
    retry: false
  });
};
