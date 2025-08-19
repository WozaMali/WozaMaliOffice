import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthCredentials, AuthResponse, authenticateUser } from '@/lib/auth-schema';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthCredentials) => Promise<AuthResponse>;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      // Check localStorage for saved auth data
      const savedUser = localStorage.getItem('woza-mali-user');
      const savedToken = localStorage.getItem('woza-mali-token');
      
      if (savedUser && savedToken) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      // Clear invalid data
      localStorage.removeItem('woza-mali-user');
      localStorage.removeItem('woza-mali-token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: AuthCredentials): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = authenticateUser(credentials);
      
      if (response.success && response.user && response.token) {
        // Save to localStorage
        localStorage.setItem('woza-mali-user', JSON.stringify(response.user));
        localStorage.setItem('woza-mali-token', response.token);
        
        // Update state
        setUser(response.user);
        
        return response;
      } else {
        return response;
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during login',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('woza-mali-user');
    localStorage.removeItem('woza-mali-token');
    
    // Clear any stored redirect information
    sessionStorage.removeItem('redirectAfterLogin');
    
    // Clear state
    setUser(null);
    
    // Force redirect to login page
    window.location.href = '/';
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
