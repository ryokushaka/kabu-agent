/**
 * Authentication Hook
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import type { LoginRequest } from '@entities/user';
import { QUERY_KEYS } from '@shared/config';

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      authApi.storeAuthData(data);
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
