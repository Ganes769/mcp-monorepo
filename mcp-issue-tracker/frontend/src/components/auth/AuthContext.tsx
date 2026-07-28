import { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { isAxiosError } from 'axios';
import type { AuthState } from '@/types';
import { authApi } from '@/lib/api';

// Better Auth / Fastify errors may be a string, or an object like
// { code, message } / { error: { code, message } }. Always return a string
// so React never tries to render an object (minified error #31).
function toErrorString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message.trim()) {
      return obj.message;
    }
    if (typeof obj.error === "string" && obj.error.trim()) {
      return obj.error;
    }
    if (obj.error && typeof obj.error === "object") {
      return toErrorString(obj.error);
    }
  }
  return undefined;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    return (
      toErrorString(error.response?.data) ||
      error.message ||
      fallback
    );
  }
  return error instanceof Error ? error.message : fallback;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const response = await authApi.getSession();
      
      if (response.user) {
        setAuthState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authApi.signIn({ email, password });
      
      if (response.user) {
        setAuthState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error: unknown) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: extractErrorMessage(error, 'Sign in failed') };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authApi.signUp({ email, password, name });
      
      if (response.user) {
        setAuthState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: 'Sign up failed' };
      }
    } catch (error: unknown) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: extractErrorMessage(error, 'Sign up failed') };
    }
  };

  const signOut = async () => {
    try {
      await authApi.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Clear stored API key
      localStorage.removeItem('userApiKey');
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const refetchUser = async () => {
    await checkAuthStatus();
  };

  const value: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
    refetchUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
