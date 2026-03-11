// src/hooks/useSupabase.ts
import { useQuery } from '@tanstack/react-query';
import { supabase, type Database } from '../lib/supabaseClient';

// Типы из Supabase
export type Composer = Database['public']['Tables']['composers']['Row'];
export type Work = Database['public']['Tables']['works']['Row'];

export const useComposers = () => {
  return useQuery({
    queryKey: ['composers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('composers')
        .select('*')
        .order('x', { ascending: true });

      if (error) throw error;
      return data;
    }
  });
};

export const useWorks = (composerId?: string) => {
  return useQuery({
    queryKey: ['works', composerId],
    queryFn: async () => {
      const query = supabase.from('works').select('*');

      if (composerId) {
        query.eq('composer_id', composerId);
      }

      const { data, error } = await query.order('id', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });
};

export const useWork = (workId?: string) => {
  return useQuery({
    queryKey: ['work', workId],
    queryFn: async () => {
      if (!workId) return null;

      const { data, error } = await supabase
        .from('works')
        .select('*')
        .eq('id', workId)
        .single();

      if (error) throw error;
      return data;
    }
  });
};
