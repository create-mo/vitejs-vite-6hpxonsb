import { useState, useEffect } from 'react';
import { sbSelect, type DBComposer, type DBPiece } from '../lib/supabase';
import type { ComposerNode, MusicPiece } from '../data/database';

function toComposerNode(db: DBComposer, pieces: DBPiece[]): ComposerNode {
  const myPieces: MusicPiece[] = pieces
    .filter(p => p.treble?.length > 0)
    .map(p => ({
      id: p.id,
      title: p.title,
      tempo: p.tempo ?? 120,
      treble: p.treble ?? [],
      bass: p.bass ?? [],
    }));

  return {
    id: db.id,
    label: db.name,
    era: db.era,
    life_dates: db.life_dates ?? '',
    image: db.image ?? '',
    x: db.x ?? 0,
    y: db.y ?? 0,
    predecessors: db.predecessors ?? [],
    pieces: myPieces.length > 0 ? myPieces : [{
      id: `${db.id}_empty`,
      title: '(ноты не добавлены)',
      tempo: 120,
      treble: [],
      bass: [],
    }],
  };
}

export function useComposers() {
  const [composers, setComposers] = useState<ComposerNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useComposers] Starting fetch...');
    Promise.all([
      sbSelect<DBComposer>('composers', '*'),
      sbSelect<DBPiece>('pieces', '*'),
    ])
      .then(([dbComposers, dbPieces]) => {
        console.log('[useComposers] Loaded:', dbComposers.length, 'composers,', dbPieces.length, 'pieces');
        const nodes = dbComposers
          .sort((a, b) => a.x - b.x)
          .map(c => toComposerNode(c, dbPieces.filter(p => p.composer_id === c.id)));
        setComposers(nodes);
        console.log('[useComposers] Mapped to', nodes.length, 'nodes');
      })
      .catch(err => {
        console.error('[useComposers] Error:', err);
        setError(String(err));
      })
      .finally(() => setLoading(false));
  }, []);

  return { composers, loading, error };
}
