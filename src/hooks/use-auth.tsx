"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Types
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, profileData: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        return null;
      }

      console.log('✅ Profile fetched successfully:', data);
      return data as Profile;
    } catch (err) {
      console.error('❌ Error in fetchProfile:', err);
      return null;
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Login attempt for:', email);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Login error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ Login successful for user:', data.user.id);
        setUser(data.user);
        const userProfile = await fetchProfile(data.user.id);
        setProfile(userProfile);
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (err) {
      console.error('❌ Login exception:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, profileData: Partial<Profile>) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create profile in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: data.user.email!,
              full_name: profileData.full_name || '',
              role: profileData.role || 'customer',
              is_active: true,
            }
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          return { success: false, error: 'Profile creation failed' };
        }

        setUser(data.user);
        return { success: true };
      }

      return { success: false, error: 'Sign up failed' };
    } catch (err) {
      console.error('Sign up error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('🚪 Logging out user...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      setUser(null);
      setProfile(null);
      console.log('✅ User logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Update profile function
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Refresh profile
      await refreshProfile();
      return { success: true };
    } catch (err) {
      console.error('Profile update error:', err);
      return { success: false, error: 'Profile update failed' };
    }
  };

  // Refresh profile function
  const refreshProfile = async () => {
    if (!user) return;

    try {
      const userProfile = await fetchProfile(user.id);
      setProfile(userProfile);
    } catch (err) {
      console.error('Profile refresh error:', err);
    }
  };

  // Effect to handle auth state changes
  useEffect(() => {
    console.log('🔐 useAuth: Starting auth state check');
    
    const checkUser = async () => {
      try {
        console.log('🔐 useAuth: Fetching user session...');
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ useAuth: Session error:', error);
        }
        
        if (session?.user) {
          console.log('✅ useAuth: User session found:', session.user.id);
          setUser(session.user);
          const userProfile = await fetchProfile(session.user.id);
          setProfile(userProfile);
        } else {
          console.log('ℹ️ useAuth: No user session found');
        }
      } catch (err) {
        console.error('❌ useAuth: Error fetching user:', err);
      } finally {
        console.log('🔐 useAuth: Setting isLoading to false');
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 useAuth: Auth state change:', event, session?.user?.id);
        if (session?.user) {
          setUser(session.user);
          const userProfile = await fetchProfile(session.user.id);
          setProfile(userProfile);
        } else {
          setUser(null);
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    error,
    login,
    signUp,
    logout,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
