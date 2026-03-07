/**
 * Supabase client configuration for College Pathway Explorer
 * Handles authentication and database operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yprxfmbwbxwdpmazgadp.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwcnhmbWJ3Ynh3ZHBtYXpnYWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MTQwMDAsImV4cCI6MjA0NjA5MDAwMH0.xxxxxxxxxxxxxxxx';

export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'dummy');

// Auth helpers
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async (): Promise<any> => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// User profile helpers
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateUserProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

// Favorites helpers
export const getFavorites = async (userId: string) => {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      *,
      institution:institutions(id, name, city, state, institution_type)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const addFavorite = async (userId: string, institutionId: number) => {
  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, institution_id: institutionId })
    .select()
    .single();
  return { data, error };
};

export const removeFavorite = async (userId: string, institutionId: number) => {
  const { data, error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('institution_id', institutionId);
  return { data, error };
};

export const isFavorite = async (userId: string, institutionId: number) => {
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('institution_id', institutionId)
    .single();
  return { data: !!data, error };
};

// Search history helpers
export const addSearchHistory = async (userId: string, searchQuery: string, filters: any, resultsCount: number) => {
  const { data, error } = await supabase
    .from('search_history')
    .insert({
      user_id: userId,
      search_query: searchQuery,
      filters: filters || {},
      results_count: resultsCount,
    })
    .select()
    .single();
  return { data, error };
};

export const getSearchHistory = async (userId: string, limit = 20) => {
  const { data, error } = await supabase
    .from('search_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
};

export const clearSearchHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('search_history')
    .delete()
    .eq('user_id', userId);
  return { data, error };
};

// Transfer pathway helpers
export const getTransferPathways = async (institutionId: number) => {
  // Get pathways where this institution is the SOURCE (where students can transfer TO)
  const { data: asSource, error: error1 } = await supabase
    .from('transfer_pathways')
    .select(`
      *,
      target:institutions!transfer_pathways_target_institution_id_fkey(
        id, name, city, state, institution_type
      )
    `)
    .eq('source_institution_id', institutionId);

  // Get pathways where this institution is the TARGET (where students can transfer FROM)
  const { data: asTarget, error: error2 } = await supabase
    .from('transfer_pathways')
    .select(`
      *,
      source:institutions!transfer_pathways_source_institution_id_fkey(
        id, name, city, state, institution_type
      )
    `)
    .eq('target_institution_id', institutionId);

  return {
    pathwaysFrom: asSource || [],  // From this CC to 4-year
    pathwaysTo: asTarget || [],    // From other CCs to this 4-year
    error: error1 || error2,
  };
};

export const searchTransferPathways = async (institutionId: number, type = 'all') => {
  if (type === 'source' || type === 'all') {
    const { data: asSource, error: error1 } = await supabase
      .from('transfer_pathways')
      .select(`
        *,
        target:institutions!transfer_pathways_target_institution_id_fkey(
          id, name, city, state, institution_type
        )
      `)
      .eq('source_institution_id', institutionId);

    if (error1) return { data: null, error: error1 };
    return { data: asSource, error: null };
  }

  if (type === 'target') {
    const { data: asTarget, error: error2 } = await supabase
      .from('transfer_pathways')
      .select(`
        *,
        source:institutions!transfer_pathways_source_institution_id_fkey(
          id, name, city, state, institution_type
        )
      `)
      .eq('target_institution_id', institutionId);

    if (error2) return { data: null, error: error2 };
    return { data: asTarget, error: null };
  }

  return { data: [], error: null };
};

// Get institutions eligible for transfer (2-year colleges)
export const getCommunityColleges = async (state = null) => {
  let query = supabase
    .from('institutions')
    .select('id, name, city, state, institution_type')
    .ilike('institution_type', '%2-year%');

  if (state) {
    query = query.eq('state', state);
  }

  const { data, error } = await query.limit(100);
  return { data, error };
};

// Get 4-year institutions that accept transfers
export const getTransferUniversities = async (state = null) => {
  let query = supabase
    .from('institutions')
    .select('id, name, city, state, institution_type')
    .ilike('institution_type', '%4-year%');

  if (state) {
    query = query.eq('state', state);
  }

  const { data, error } = await query.limit(100);
  return { data, error };
};

// Get programs/majors for a specific institution
export const getInstitutionPrograms = async (institutionId: number) => {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('institution_id', institutionId)
    .order('median_earnings', { ascending: false, nullsFirst: false });
  return { data, error };
};
