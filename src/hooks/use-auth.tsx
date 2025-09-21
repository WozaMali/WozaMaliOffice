"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { LogoutUtils } from '@/lib/logout-utils';

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
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
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

  // Fetch user profile from unified schema first, fallback to legacy profiles table
  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching profile for user (unified users):', userId);
      const { data: unifiedUser, error: unifiedError } = await supabase
        .from('users')
        .select(`
          id, 
          email, 
          full_name, 
          phone, 
          status, 
          role_id,
          roles!role_id(name)
        `)
        .eq('id', userId)
        .maybeSingle();

      if (!unifiedError && unifiedUser) {
        console.log('✅ Unified user profile fetched:', unifiedUser.id);
        const mapped: Profile = {
          id: unifiedUser.id,
          email: unifiedUser.email,
          full_name: unifiedUser.full_name || '',
          phone: unifiedUser.phone || undefined,
          role: unifiedUser.roles?.name || 'resident',
          is_active: (unifiedUser.status || 'active') === 'active',
          created_at: new Date().toISOString(),
        };
        return mapped;
      }

      // Fallback to legacy profiles table if it exists, otherwise build minimal profile from session
      console.log('ℹ️ Falling back to legacy profiles for user:', userId, unifiedError);
      try {
        const { data: legacyProfile, error: legacyError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!legacyError && legacyProfile) {
          console.log('✅ Legacy profile fetched successfully:', legacyProfile.id);
          return legacyProfile as Profile;
        }
        if (legacyError) {
          console.warn('⚠️ Legacy profiles not available, using minimal session profile');
        }
      } catch (e) {
        console.warn('⚠️ Legacy profiles table missing, using minimal session profile');
      }

      // Minimal profile derived from session when tables are missing
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email || '';
      const roleGuess = email.toLowerCase().includes('superadmin@wozamali.co.za')
        ? 'super_admin'
        : (email.toLowerCase().includes('admin@wozamali.com') ? 'admin' : 'resident');
      return {
        id: userId,
        email,
        full_name: '',
        phone: undefined,
        role: roleGuess,
        is_active: true,
        created_at: new Date().toISOString(),
      } as Profile;
    } catch (err) {
      console.error('❌ Error in fetchProfile:', err);
      // As a last resort build minimal profile from current session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return {
          id: session.user.id,
          email: session.user.email || '',
          full_name: '',
          phone: undefined,
          role: 'resident',
          is_active: true,
          created_at: new Date().toISOString(),
        } as Profile;
      }
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
              role: profileData.role || 'resident',
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

  // Password reset function with explicit redirect
  const resetPassword = async (email: string) => {
    try {
      console.log('🔐 Sending password reset for:', email);
      console.log('🔐 Redirect URL will be: http://localhost:8081/admin-login');
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:8081/admin-login'
      });
      
      if (error) {
        console.error('Password reset error:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Password reset email sent successfully');
      console.log('✅ Check email for magic link that should redirect to localhost:8081');
      return { success: true };
    } catch (err) {
      console.error('Password reset error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Enhanced logout function with comprehensive session clearing
  const logout = async () => {
    try {
      console.log('🚪 Logging out user...');
      
      // Clear local state first
      setUser(null);
      setProfile(null);
      
      // Use comprehensive logout utility
      await LogoutUtils.performCompleteLogout(supabase);
      
      console.log('✅ User logged out successfully and all session data cleared');
    } catch (err) {
      console.error('Logout error:', err);
      // Even if logout fails, clear local state
      setUser(null);
      setProfile(null);
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
    resetPassword,
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
