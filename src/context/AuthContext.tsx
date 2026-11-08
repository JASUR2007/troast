// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types';
import { api } from '../services/api';
import { INITIAL_PROFILES } from '../lib/mockData';

interface AuthContextType {
  currentUser: Profile | null;
  isLoading: boolean;
  isSupabaseConnected: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchQuickUser: (email: string) => Promise<void>;
  enterDemoMode: () => void;
  profiles: Profile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_STORAGE_KEY = 'troast_active_user_email';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);

  useEffect(() => {
    async function initAuth() {
      try {
        setIsLoading(true);
        const forceDemo = localStorage.getItem('troast_force_demo') === 'true';

        if (isSupabaseConfigured && supabase && !forceDemo) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const profile = await api.getProfileById(session.user.id);
            setCurrentUser(profile);
          }
          const loadedProfiles = await api.getProfiles();
          setProfiles(loadedProfiles);
        } else {
          // Демо режим
          const savedEmail = localStorage.getItem(CURRENT_USER_STORAGE_KEY) || 'manager@troast.ru';
          const found = INITIAL_PROFILES.find((p) => p.email === savedEmail) || INITIAL_PROFILES[0];
          setCurrentUser(found);
          setProfiles(INITIAL_PROFILES);
        }
      } catch (err) {
        console.error('Failed to initialize auth', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await api.getProfileById(session.user.id);
          setCurrentUser(profile);
          try {
            const list = await api.getProfiles();
            if (list.length > 0) setProfiles(list);
          } catch {
            // fallback
          }
        } else {
          setCurrentUser(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const signIn = async (email: string, password = 'TestPass123!') => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const target = INITIAL_PROFILES.find((p) => p.email.toLowerCase() === email.toLowerCase());
        if (!target) {
          throw new Error('Пользователь с таким email не найден среди тестовых аккаунтов');
        }
        setCurrentUser(target);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, target.email);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
      setCurrentUser(null);
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const switchQuickUser = async (email: string) => {
    await signIn(email, 'TestPass123!');
  };

  const enterDemoMode = () => {
    localStorage.setItem('troast_force_demo', 'true');
    setCurrentUser(INITIAL_PROFILES[0]);
    setProfiles(INITIAL_PROFILES);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isSupabaseConnected: isSupabaseConfigured,
        signIn,
        signOut,
        switchQuickUser,
        enterDemoMode,
        profiles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
