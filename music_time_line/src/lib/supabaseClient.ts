// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Project URL
const supabaseUrl = 'https://jtytuaxjkyswzuqrwweq.supabase.co';
// Anon Key из Supabase Dashboard → API → anon public
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXR1YXhqa3lzd3p1cXJ3d2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjE2NDUsImV4cCI6MjA4ODczNzY0NX0.juZjEnYf4QdRy8FV29B5jWnLyLVHtvllsqgo9rY6fQ0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Типы базы данных (упрощенные, можно заменить на сгенерированные через: npx supabase gen types typescript)
export type Composer = {
  id: string;
  name: string;
  era: 'Baroque' | 'Classical' | 'Romantic' | '20th Century' | 'Contemporary';
  life_dates: string;
  image: string;
  x: number;
  y: number;
  predecessors: string[];
  created_at: string;
};

export type ComposerInsert = Omit<Composer, 'id' | 'created_at'>;

export type Work = {
  id: string;
  composer_id: string;
  title: string;
  tonality: string;
  key: string;
  tempo: number;
  notes: string[][];
  created_at: string;
};

export type WorkInsert = Omit<Work, 'id' | 'created_at'>;

export type Listener = {
  id: string;
  user_id: string;
  current_work_id: string;
  last_played: string;
  created_at: string;
};

export type ListenerInsert = Omit<Listener, 'id' | 'created_at'>;

// Тип базы данных для Supabase client
export type Database = {
  public: {
    Tables: {
      composers: {
        Row: Composer;
        Insert: ComposerInsert;
        Update: Partial<Composer>;
      };
      works: {
        Row: Work;
        Insert: WorkInsert;
        Update: Partial<Work>;
      };
      listeners: {
        Row: Listener;
        Insert: ListenerInsert;
        Update: Partial<Listener>;
      };
    };
    Views: {
      [_: string]: never;
    };
    Functions: {
      [_: string]: never;
    };
    Enums: {
      [_: string]: never;
    };
  };
};
