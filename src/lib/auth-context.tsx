"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  supabase, 
  getSession, 
  getUserProfile,
  signIn,
  signUp,
  signOut 
} from '@/lib/supabase-client';

interface AuthContextType {
  user: any;
  profile: any;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (updates: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    async function loadUser() {
      const { session } = await getSession();
      
      if (session?.user) {
        setUser(session.user);
        
        // Load profile
        const { data: profile } = await getUserProfile(session.user.id);
        if (profile) {
          setProfile(profile);
        }
      }
      
      setLoading(false);
    }
    
    loadUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        
        // Load profile
        const { data: profile } = await getUserProfile(session.user.id);
        if (profile) {
          setProfile(profile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await signIn(email, password);
    return result;
  };

  const signup = async (email: string, password: string) => {
    const result = await signUp(email, password);
    return result;
  };

  const logout = async (): Promise<void> => {
    await signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: any) => {
    if (!user) return { error: 'No user logged in' };
    
    const { data, error } = await getUserProfile(user.id);
    
    if (error && error.code !== 'PGRST116') {
      return { error };
    }
    
    // If profile doesn't exist, create it
    if (!data) {
      return { error: 'Profile not found' };
    }
    
    const { data: updated, error: updateError } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    
    if (!updateError) {
      setProfile(updated);
    }
    
    return { data: updated, error: updateError };
  };

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
