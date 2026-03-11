export interface MusicPiece {
  title: string;
  tempo: number;
  treble: string[];
  bass: string[];
}

export interface MusicNode {
  id: string;
  type: 'composer' | 'fork';
  label: string;
  era: 'Baroque' | 'Classical' | 'Romantic' | 'Transition';
  x: number;
  y: number;
  predecessors: string[];
  pieces?: MusicPiece[]; // Массив произведений вместо одной темы
}

export const MUSIC_MAP: MusicNode[] = [
  // === BAROQUE ZONE (X: 0 - 1.5) ===
  {
    id: 'bach',
    type: 'composer',
    label: 'J.S. Bach',
    era: 'Baroque',
    x: 0,
    y: 0,
    predecessors: [],
    pieces: [
      {
        title: 'Minuet in G',
        tempo: 120,
        treble: [
          'd/5, g/4, a/4, b/4, c/5',
          'd/5, g/4, g/4',
          'e/5, c/5, d/5, e/5, f/5',
          'g/5, g/4, g/4',
        ],
        bass: ['g/3, b/3, d/4', 'b/3, d/4', 'c/4, e/4, c/4', 'b/3, g/3'],
      },
      {
        title: 'Toccata in Dm',
        tempo: 100,
        treble: [
          'a/5, g/5, a/5/16, g/5/16, f/5/16, e/5/16, d/5/16, c#/5',
          'd/5/h, r',
        ],
        bass: ['d/3, r', 'd/2, r'], // Упрощено для демо
      },
    ],
  },
  {
    id: 'vivaldi',
    type: 'composer',
    label: 'A. Vivaldi',
    era: 'Baroque',
    x: 0,
    y: 2.5,
    predecessors: [],
    pieces: [
      {
        title: 'Spring (Four Seasons)',
        tempo: 110,
        treble: [
          'e/5, g#/4, g#/4, g#/4',
          'f#/4, e/4, b/3, b/3',
          'e/5, g#/4, g#/4, g#/4',
          'f#/4, e/4, b/3',
        ],
        bass: [
          'e/3, b/3, e/4, b/3',
          'e/3, b/3, e/4, b/3',
          'e/3, b/3, e/4, b/3',
          'e/3, b/3, e/4',
        ],
      },
      {
        title: 'Winter (Largo)',
        tempo: 60,
        treble: ['Eb/5, D/5, C/5, Bb/4', 'Ab/4, G/4, F/4, Eb/4'],
        bass: ['Eb/3, Bb/3', 'Ab/3, Eb/3'],
      },
    ],
  },

  // === TRANSITION (X: 1.5) ===
  {
    id: 'galant_fork',
    type: 'fork',
    label: 'Galant Style',
    era: 'Transition',
    x: 1.5,
    y: 1.2,
    predecessors: ['bach', 'vivaldi'],
  },

  // === CLASSICAL ZONE (X: 2.0 - 3.5) ===
  {
    id: 'haydn',
    type: 'composer',
    label: 'J. Haydn',
    era: 'Classical',
    x: 2.5,
    y: 0,
    predecessors: ['galant_fork'],
    pieces: [
      {
        title: 'Surprise Symphony',
        tempo: 110,
        treble: [
          'c/4, c/4, e/4, e/4',
          'g/4, g/4, e/4',
          'f/4, f/4, d/4, d/4',
          'b/3, b/3, g/3',
        ],
        bass: [
          'c/3, e/3, g/3, c/4',
          'c/3, e/3, g/3',
          'g/2, b/2, d/3, g/3',
          'g/2, g/2, g/2',
        ],
      },
    ],
  },
  {
    id: 'mozart',
    type: 'composer',
    label: 'W.A. Mozart',
    era: 'Classical',
    x: 3.5,
    y: 0,
    predecessors: ['haydn'],
    pieces: [
      {
        title: 'Sonata Facile',
        tempo: 140,
        treble: [
          'c/5, e/5, g/5',
          'b/4, c/5, d/5, c/5',
          'a/4, g/4, c/5, g/4, f/4, g/4',
          'e/4/h',
        ],
        bass: [
          'c/3, g/3, e/3, g/3',
          'c/3, g/3, e/3, g/3',
          'c/3, a/3, f/3, a/3',
          'c/3, g/3, e/3, g/3',
        ],
      },
      {
        title: 'Alla Turca',
        tempo: 150,
        treble: [
          'b/4, a/4, g#/4, a/4',
          'c/5, d/5, c/5, b/4, c/5',
          'e/5, f/5, e/5, d#/5, e/5',
          'b/5, a/5, g#/5, a/5, b/5, a/5, g#/5, a/5, c/6',
        ],
        bass: [
          'a/2, c/3, e/3, a/3',
          'a/3, e/3, c/3, a/2',
          'a/2, r',
          'a/2, a/2, a/2, a/2',
        ],
      },
    ],
  },

  // === ROMANTIC ZONE (X: 4.5+) ===
  {
    id: 'beethoven',
    type: 'composer',
    label: 'L.v. Beethoven',
    era: 'Romantic',
    x: 4.5,
    y: -0.5,
    predecessors: ['mozart', 'haydn'],
    pieces: [
      {
        title: 'Ode to Joy',
        tempo: 120,
        treble: [
          'e/4, e/4, f/4, g/4',
          'g/4, f/4, e/4, d/4',
          'c/4, c/4, d/4, e/4',
          'e/4, d/4, d/4',
        ],
        bass: [
          'c/3, e/3, g/3',
          'c/3, f/3, a/3',
          'c/3, e/3, g/3',
          'g/2, b/2, d/3',
        ],
      },
      {
        title: 'Moonlight Sonata',
        tempo: 60,
        treble: [
          'g#/3, c#/4, e/4',
          'g#/3, c#/4, e/4',
          'g#/3, c#/4, e/4',
          'g#/3, c#/4, e/4',
        ],
        bass: ['c#/2, c#/3', 'c#/2, c#/3', 'b/1, b/2', 'b/1, b/2'],
      },
      {
        title: 'Symphony No. 5',
        tempo: 160,
        treble: ['r, g/4, g/4, g/4', 'eb/4/h', 'r, f/4, f/4, f/4', 'd/4/h'],
        bass: ['r, g/2, g/2, g/2', 'eb/2/h', 'r, f/2, f/2, f/2', 'd/2/h'],
      },
    ],
  },
];
