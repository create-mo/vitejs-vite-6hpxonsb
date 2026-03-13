// Supabase REST API клиент без SDK (работает в StackBlitz)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
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
