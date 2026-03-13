// Supabase REST API клиент без SDK (работает в StackBlitz)
const SUPABASE_URL = 'https://jtytuaxjkyswzuqrwweq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXR1YXhqa3lzd3p1cXJ3d2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjE2NDUsImV4cCI6MjA4ODczNzY0NX0.GtVGtdODtFP6Jb351qOrx8KG7ey6ov6cFnrCrA1vP9E';

console.log('[supabase.ts] Hardcoded credentials loaded');

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

export async function sbSelect<T>(
  table: string,
  query = '*'
): Promise<T[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(query)}`;
  console.log('[sbSelect] Fetching:', url);
  const res = await fetch(url, { headers });
  console.log('[sbSelect]', table, 'status:', res.status);
  if (!res.ok) {
    const err = await res.text();
    console.error('[sbSelect] Error:', err);
    throw new Error(err);
  }
  const data = await res.json();
  console.log('[sbSelect]', table, 'got', Array.isArray(data) ? data.length : 'object');
  return data;
}

// Типы
export interface DBComposer {
  id: string;
  name: string;
  era: 'Baroque' | 'Classical' | 'Romantic' | '20th Century' | 'Contemporary';
  life_dates: string;
  image: string;
  x: number;
  y: number;
  predecessors: string[];
  openopus_id?: number;
}

export interface DBPiece {
  id: string;
  composer_id: string;
  title: string;
  tempo: number;
  treble: string[];
  bass: string[];
}
