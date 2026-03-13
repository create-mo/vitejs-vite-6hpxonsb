// src/data/database.ts

export interface MusicPiece {
  id: string;
  title: string;
  tempo: number;
  treble: string[];
  bass: string[];
}

export interface ComposerNode {
  id: string;
  label: string;
  era: 'Baroque' | 'Classical' | 'Romantic' | '20th Century' | 'Contemporary';
  life_dates: string;
  image: string;
  x: number; // Горизонтальная позиция (время)
  y: number; // Вертикальное отклонение от центра (0 - центр)
  predecessors: string[];
  pieces: MusicPiece[];
}

const IMG_BASE = 'https://upload.wikimedia.org/wikipedia/commons';

export const DATABASE: ComposerNode[] = [
  // === BAROQUE (X: 0-2) ===
  {
    id: 'bach',
    label: 'J.S. Bach',
    era: 'Baroque',
    life_dates: '1685–1750',
    image: `${IMG_BASE}/6/6a/Johann_Sebastian_Bach.jpg`,
    x: 0,
    y: 0,
    predecessors: [],
    pieces: [
      {
        id: 'bach_toccata_full',
        title: 'Toccata in Dm (Full intro)',
        tempo: 90,
        treble: [
          'a/5/16, g/5/16, a/5/16, g/5/16, f/5/16, e/5/16, d/5/16, c#/5/16',
          'd/5/q, r/q, r/h',
          'a/4/16, g/4/16, a/4/16, g/4/16, f/4/16, e/4/16, d/4/16, c#/4/16',
          'd/4/q, r/q, r/h',
          'a/3/16, g/3/16, a/3/16, g/3/16, f/3/16, e/3/16, d/3/16, c#/3/16',
          'd/3/q, r/q, r/q, a/2/8, b/2/8',
          'c#/3/q, d/3/q, e/3/q, f/3/q',
          'g/3/q, f/3/q, e/3/q, d/3/q',
          'c#/3/w',
        ],
        bass: ['d/3/w', 'd/2/w', 'd/2/w', 'd/2/w', 'a/1/w', 'a/1/w', 'a/1/w'],
      },
    ],
  },
  {
    id: 'vivaldi',
    label: 'A. Vivaldi',
    era: 'Baroque',
    life_dates: '1678–1741',
    image: `${IMG_BASE}/b/bd/Vivaldi.jpg`,
    x: 0.5,
    y: -1.2,
    predecessors: [],
    pieces: [
      {
        id: 'viv_spring_full',
        title: 'Spring (Allegro)',
        tempo: 110,
        treble: [
          'e/5, g#/4, g#/4, g#/4',
          'f#/4, e/4, b/3, b/3',
          'e/5, g#/4, g#/4, g#/4',
          'f#/4, e/4, b/3',
          'g#/4, a/4, b/4, c#/5',
          'b/4, a/4, g#/4, f#/4',
          'e/4, f#/4, g#/4, a/4',
          'b/4, e/5, e/4',
          'e/5, g#/4, g#/4, g#/4',
          'f#/4, e/4, b/3, b/3',
          'b/4, a/4, g#/4, f#/4',
          'e/4/h, r/h',
        ],
        bass: [
          'e/3, b/3, e/4, b/3',
          'e/3, b/3, e/4, b/3',
          'e/3, b/3, e/4, b/3',
          'e/3, b/3, e/4, b/3',
          'e/3, b/3, e/3, a/3',
          'b/3, b/2, b/3, b/2',
          'c#/3, a/2, b/2, b/2',
          'e/3, e/2, e/3',
          'e/3, b/3, e/4, b/3',
          'e/3, b/3, e/4, b/3',
          'b/2, b/2, b/2, b/2',
          'e/3/h, r/h',
        ],
      },
    ],
  },

  // === CLASSICAL (X: 3-5) ===
  {
    id: 'mozart',
    label: 'W.A. Mozart',
    era: 'Classical',
    life_dates: '1756–1791',
    image: `${IMG_BASE}/1/1e/Wolfgang-amadeus-mozart_1.jpg`,
    x: 3.5,
    y: 0.8,
    predecessors: ['bach', 'vivaldi'],
    pieces: [
      {
        id: 'mozart_k545_full',
        title: 'Sonata K.545 (Ext.)',
        tempo: 135,
        treble: [
          'c/5, e/5, g/5',
          'b/4, c/5, d/5, c/5',
          'a/4, g/4, c/5, g/4, f/4, g/4',
          'e/4/h',
          'a/4, g/4, f/4, e/4',
          'd/4, c/4, b/3, c/4',
          'd/4, e/4, c/4, d/4',
          'g/3/h',
          'g/4, a/4, b/4, c/5',
          'd/5, e/5, f/5, g/5',
          'a/5, g/5, f/5, e/5',
          'd/5, c/5, b/4, a/4',
        ],
        bass: [
          'c/3, g/3, e/3, g/3',
          'c/3, g/3, e/3, g/3',
          'c/3, a/3, f/3, a/3',
          'c/3, g/3, e/3, g/3',
          'f/3, c/4, a/3, c/4',
          'f/3, c/4, a/3, c/4',
          'g/3, b/3, g/3, b/3',
          'g/3/h',
          'g/3, r, r, r',
          'g/3, r, r, r',
          'c/3, r, r, r',
          'f/3, r, g/3, r',
        ],
      },
    ],
  },

  // === ROMANTIC (X: 6-8) ===
  {
    id: 'beethoven',
    label: 'L.v. Beethoven',
    era: 'Romantic',
    life_dates: '1770–1827',
    image: `${IMG_BASE}/6/6f/Beethoven.jpg`,
    x: 6,
    y: 0.4,
    predecessors: ['mozart', 'vivaldi'],
    pieces: [
      {
        id: 'beet_ode_full',
        title: 'Ode to Joy (Full Theme)',
        tempo: 120,
        treble: [
          'e/4, e/4, f/4, g/4',
          'g/4, f/4, e/4, d/4',
          'c/4, c/4, d/4, e/4',
          'e/4, d/4, d/4',
          'e/4, e/4, f/4, g/4',
          'g/4, f/4, e/4, d/4',
          'c/4, c/4, d/4, e/4',
          'd/4, c/4, c/4',
          'd/4, d/4, e/4, c/4',
          'd/4, e/4/8, f/4/8, e/4, c/4',
          'd/4, e/4/8, f/4/8, e/4, d/4',
          'c/4, d/4, g/3/h',
        ],
        bass: [
          'c/3, e/3, g/3',
          'c/3, f/3, a/3',
          'c/3, e/3, g/3',
          'g/2, b/2, d/3',
          'c/3, e/3, g/3',
          'c/3, f/3, a/3',
          'c/3, e/3, g/3',
          'g/2, c/3',
          'g/2, b/2, c/3',
          'g/2, c/3, c/3',
          'g/2, b/2, c/3, g/2',
          'a/2, f#/2, g/2',
        ],
      },
    ],
  },
  {
    id: 'tchaikovsky',
    label: 'P.I. Tchaikovsky',
    era: 'Romantic',
    life_dates: '1840–1893',
    image: `${IMG_BASE}/1/15/Pyotr_Ilyich_Tchaikovsky_late_portrait.jpg`,
    x: 8,
    y: -1.0,
    predecessors: ['beethoven', 'mozart'],
    pieces: [
      {
        id: 'swan_lake',
        title: 'Swan Lake Theme',
        tempo: 100,
        treble: [
          'b/4/h, a/4/8, f#/4/8',
          'd/4/8, e/4/8, f#/4/h',
          'b/3/8, d/4/8, f#/4/h',
          'a/4/8, g/4/8, e/4/h',
          'b/4/h, a/4/8, f#/4/8',
          'd/4/8, e/4/8, f#/4/4, d/5/4',
        ],
        bass: [
          'b/2, f#/3, b/3, f#/3',
          'b/2, d/3, b/3, d/3',
          'b/2, f#/3, b/3, f#/3',
          'e/3, g/3, b/3, g/3',
          'b/2, f#/3, d/3, f#/3',
          'b/2, f#/3, b/3, r',
        ],
      },
    ],
  },

  // === 20TH CENTURY (X: 9-11) ===
  {
    id: 'debussy',
    label: 'C. Debussy',
    era: '20th Century',
    life_dates: '1862–1918',
    image: `${IMG_BASE}/4/48/Claude_Debussy_atelier_Nadar.jpg`,
    x: 9.5,
    y: 0.7,
    predecessors: ['tchaikovsky', 'beethoven'],
    pieces: [
      {
        id: 'clair_de_lune',
        title: 'Clair de Lune',
        tempo: 60,
        treble: [
          'r, f/5, e/5, d/5',
          'c/5/h, d/5/q',
          'c/5/h, a/4/q',
          'c/5/h, g/4/q',
          'f/4, a/4, g/4, f/4',
          'e/4, d/4, e/4, a/3',
        ],
        bass: [
          'f/3, a/3, c/4',
          'f/3, a/3, c/4',
          'f/3, a/3, c/4',
          'e/3, g/3, c/4',
          'd/3, f/3, a/3',
          'c/3, e/3, a/3',
        ],
      },
    ],
  },
  {
    id: 'stravinsky',
    label: 'I. Stravinsky',
    era: '20th Century',
    life_dates: '1882–1971',
    image: `${IMG_BASE}/6/6c/Igor_Stravinsky_LOC_32392u.jpg`,
    x: 11,
    y: -0.8,
    predecessors: ['debussy', 'tchaikovsky'],
    pieces: [
      {
        id: 'rite_spring',
        title: 'Rite of Spring (Opening)',
        tempo: 70,
        treble: [
          'c/5/8, b/4/8, g/4/8, e/4/8, b/4/4',
          'a/4/8, g/4/8, e/4/4, a/4/4',
          'g/4/8, e/4/8, d/4/4, g/4/4',
        ],
        bass: ['c/3/w', 'c/3/w', 'c/3/w'], // Дрон в басу
      },
    ],
  },

  // === CONTEMPORARY (X: 12+) ===
  {
    id: 'reich',
    label: 'Steve Reich',
    era: 'Contemporary',
    life_dates: '1936–',
    image: `${IMG_BASE}/0/03/Steve_Reich_New_York_City_1987.jpg`,
    x: 13,
    y: 0.6,
    predecessors: ['stravinsky', 'debussy'],
    pieces: [
      {
        id: 'piano_phase',
        title: 'Piano Phase (Pattern)',
        tempo: 180,
        // Минималистичный паттерн
        treble: [
          'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
          'b/4/8, f#/4/8, d/5/8, c#/5/8, e/4/8, f#/4/8, b/4/8, c#/5/8',
        ],
        bass: [
          'e/3/8, r, b/3/8, r, d/4/8, r, e/3/8, r',
          'b/3/8, r, d/4/8, r, e/3/8, r, b/3/8, r',
        ],
      },
    ],
  },
];
