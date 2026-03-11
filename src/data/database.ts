// src/data/database.ts
// Типы для UI (используется в audio player)
export interface MusicPiece {
  id: string;
  title: string;
  tempo: number;
  treble: string[];
  bass: string[];
}
