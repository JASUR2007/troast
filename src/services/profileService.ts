// src/services/profileService.ts
import { supabase, isLiveMode } from '../lib/supabase';
import { Profile } from '../types';
import { INITIAL_PROFILES } from '../lib/mockData';

export const profileService = {
  async getProfiles(): Promise<Profile[]> {
    if (isLiveMode()) {
      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .order('display_name');
      if (error) throw error;
      return data as Profile[];
    }
    return INITIAL_PROFILES;
  },

  async getProfileById(userId: string): Promise<Profile | null> {
    if (isLiveMode()) {
      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) return null;
      return data as Profile;
    }
    return INITIAL_PROFILES.find((p) => p.id === userId) || null;
  },
};
