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
        title: 'Toccata & Fugue in Dm (BWV 565)',
        tempo: 90,
        treble: [
          // === TOCCATA — нисходящий пробег от A5 ===
          'a/5/16, g/5/16, f/5/16, e/5/16, d/5/16, c#/5/16, d/5/8',
          'd/5/q, r/q, r/h',
          'a/4/16, g/4/16, f/4/16, e/4/16, d/4/16, c#/4/16, d/4/8',
          'd/4/q, r/q, r/h',
          'a/3/16, g/3/16, f/3/16, e/3/16, d/3/16, c#/3/16, d/3/8',
          'd/3/q, r/q, r/q, a/2/8, b/2/8',
          // Восходящие хроматические гаммы
          'c#/3/q, d/3/q, e/3/q, f/3/q',
          'g/3/q, a/3/q, bb/3/q, c/4/q',
          'd/4/q, e/4/q, f/4/q, g/4/q',
          'a/4/h, d/4/h',
          // === ФУГА — экспозиция (тема в d-moll) ===
          'd/4/q, f/4/q, a/4/q, d/5/q',
          'c/5/q, bb/4/q, a/4/q, g/4/q',
          'f/4/q, e/4/q, d/4/q, c#/4/q',
          'd/4/h, r/h',
          // Ответ на доминанте (a-moll)
          'a/4/q, c/5/q, e/5/q, a/5/q',
          'g/5/q, f/5/q, e/5/q, d/5/q',
          'c/5/q, b/4/q, a/4/q, g#/4/q',
          'a/4/h, r/h',
          // Третий голос (F-dur)
          'f/4/q, a/4/q, c/5/q, f/5/q',
          'e/5/q, d/5/q, c/5/q, bb/4/q',
          'a/4/q, g/4/q, f/4/q, e/4/q',
          'd/4/h, f/4/h',
          // Стретта и финальная каденция
          'a/4/q, g#/4/q, a/4/q, c#/5/q',
          'd/5/q, c/5/q, bb/4/q, a/4/q',
          'g/4/q, f/4/q, e/4/q, d/4/q',
          'c#/4/q, e/4/q, a/4/q, e/4/q',
          'd/4/w',
        ],
        bass: [
          // Токката — органный педальный тон
          'd/3/w',
          'd/2/w',
          'd/2/w',
          'd/2/w',
          'a/1/w',
          'a/1/w',
          // Восходящие хроматические ходы
          'a/1/q, c/2/q, e/2/q, g/2/q',
          'a/1/q, d/2/q, f/2/q, a/2/q',
          'bb/1/q, f/2/q, d/2/q, bb/1/q',
          'a/1/h, a/2/h',
          // Фуга — шагающий бас
          'd/2/q, a/2/q, f/2/q, d/2/q',
          'e/2/q, c/3/q, a/2/q, c/3/q',
          'bb/2/q, f/2/q, d/2/q, f/2/q',
          'a/2/h, d/2/h',
          // Ответ
          'a/2/q, e/3/q, c/3/q, a/2/q',
          'b/2/q, g/3/q, e/3/q, g/3/q',
          'f/3/q, e/3/q, d/3/q, c/3/q',
          'b/2/h, a/2/h',
          // Третий голос
          'f/2/q, c/3/q, a/2/q, f/2/q',
          'g/2/q, d/3/q, bb/2/q, g/2/q',
          'c/3/q, g/2/q, e/2/q, c/2/q',
          'f/2/h, c/2/h',
          // Финальная каденция
          'a/2/q, e/3/q, a/2/q, a/1/q',
          'a/1/q, e/2/q, a/2/q, e/2/q',
          'a/1/q, c#/2/q, e/2/q, a/2/q',
          'a/1/q, e/2/q, a/2/q, e/2/q',
          'd/2/w',
        ],
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
        title: 'Four Seasons — Spring (Allegro)',
        tempo: 112,
        treble: [
          // === Главная весенняя тема — A секция ===
          'e/5/q, d#/5/q, e/5/q, f#/5/q',
          'g#/5/q, f#/5/q, e/5/q, d#/5/q',
          'e/5/8, f#/5/8, g#/5/8, a/5/8, b/5/q, a/5/q',
          'g#/5/h, e/5/h',
          // === Птичьи трели — B секция ===
          'e/5/8, e/5/8, f#/5/8, e/5/8, d#/5/q, e/5/q',
          'f#/5/8, g#/5/8, a/5/8, g#/5/8, f#/5/q, e/5/q',
          'b/5/8, a/5/8, g#/5/8, f#/5/8, e/5/q, d#/5/q',
          'e/5/h, r/h',
          // === Возврат A темы ===
          'e/5/q, d#/5/q, e/5/q, f#/5/q',
          'g#/5/q, a/5/q, b/5/q, a/5/q',
          'g#/5/8, f#/5/8, e/5/8, d#/5/8, e/5/q, g#/5/q',
          'b/5/h, g#/5/h',
          // === Развитие — ручеёк ===
          'e/5/16, f#/5/16, e/5/16, d#/5/16, e/5/q, b/4/q',
          'c#/5/16, d#/5/16, c#/5/16, b/4/16, c#/5/q, a/4/q',
          'b/4/16, c#/5/16, b/4/16, a/4/16, b/4/q, g#/4/q',
          'a/4/h, e/4/h',
          // === Финальное утверждение ===
          'e/5/q, g#/5/q, b/5/q, g#/5/q',
          'f#/5/q, a/5/q, c#/6/q, a/5/q',
          'b/5/q, g#/5/q, e/5/q, d#/5/q',
          'e/5/w',
        ],
        bass: [
          'e/3/q, b/3/q, e/3/q, b/3/q',
          'e/3/q, b/3/q, e/3/q, b/3/q',
          'e/3/q, b/3/q, e/3/q, a/3/q',
          'b/3/h, e/3/h',
          'e/3/q, b/3/q, e/3/q, b/3/q',
          'c#/3/q, g#/3/q, a/3/q, e/3/q',
          'b/2/q, f#/3/q, b/2/q, f#/3/q',
          'e/3/h, r/h',
          'e/3/q, b/3/q, e/3/q, b/3/q',
          'a/3/q, e/3/q, a/3/q, e/3/q',
          'b/3/q, g#/3/q, e/3/q, b/2/q',
          'e/3/h, e/2/h',
          'e/3/q, b/3/q, e/3/q, b/3/q',
          'a/2/q, e/3/q, a/2/q, e/3/q',
          'b/2/q, f#/3/q, b/2/q, f#/3/q',
          'a/2/h, e/2/h',
          'e/3/q, b/3/q, e/4/q, b/3/q',
          'f#/3/q, c#/4/q, f#/3/q, c#/4/q',
          'b/2/q, f#/3/q, b/2/q, f#/3/q',
          'e/2/w',
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
        title: 'Sonata K.545 — Complete Exposition',
        tempo: 132,
        treble: [
          // === Главная тема — C-dur ===
          'c/5/q, e/5/q, g/5/q, e/5/q',
          'g/5/q, a/5/q, g/5/q, f/5/q',
          'e/5/q, c/5/q, g/4/q, e/4/q',
          'f/4/q, g/4/q, a/4/q, g/4/q',
          // Связующий пассаж (Alberti в правой руке)
          'c/5/8, d/5/8, e/5/8, f/5/8, e/5/q, d/5/q',
          'c/5/q, b/4/q, a/4/q, b/4/q',
          'c/5/q, e/5/q, g/5/q, e/5/q',
          'g/5/h, r/h',
          // === Вторая тема — G-dur ===
          'g/5/q, f#/5/q, e/5/q, d/5/q',
          'c/5/q, b/4/q, a/4/q, g/4/q',
          'b/4/q, c/5/q, d/5/q, e/5/q',
          'f#/5/q, g/5/q, a/5/q, b/5/q',
          'g/5/q, f#/5/q, e/5/q, d/5/q',
          'c/5/q, d/5/q, b/4/q, g/4/q',
          // Заключительная тема
          'g/4/8, a/4/8, b/4/8, c/5/8, d/5/8, e/5/8, f#/5/8, g/5/8',
          'g/5/q, f#/5/q, e/5/q, d/5/q',
          // === Разработка ===
          'a/4/q, c/5/q, e/5/q, c/5/q',
          'f/4/q, a/4/q, c/5/q, a/4/q',
          'g/4/q, b/4/q, d/5/q, b/4/q',
          'e/4/q, g/4/q, b/4/q, g/4/q',
          // === Реприза — возврат C-dur ===
          'c/5/q, e/5/q, g/5/q, e/5/q',
          'g/5/q, a/5/q, g/5/q, f/5/q',
          'e/5/q, c/5/q, g/4/q, e/4/q',
          'd/4/q, e/4/q, f/4/q, g/4/q',
          'c/5/h, g/4/h',
          'c/5/w',
        ],
        bass: [
          // Альбертиев бас — C-dur
          'c/3/q, g/3/q, e/3/q, g/3/q',
          'c/3/q, g/3/q, e/3/q, g/3/q',
          'c/3/q, g/3/q, e/3/q, g/3/q',
          'f/3/q, c/4/q, a/3/q, c/4/q',
          'g/3/q, d/4/q, b/3/q, d/4/q',
          'g/3/q, d/4/q, b/3/q, d/4/q',
          'c/3/q, g/3/q, e/3/q, g/3/q',
          'g/2/h, g/3/h',
          // G-dur
          'g/3/q, d/4/q, b/3/q, d/4/q',
          'g/3/q, d/4/q, b/3/q, d/4/q',
          'g/3/q, d/4/q, b/3/q, d/4/q',
          'c/3/q, g/3/q, e/3/q, g/3/q',
          'd/3/q, a/3/q, f#/3/q, a/3/q',
          'g/3/q, d/4/q, g/3/q, d/4/q',
          'g/3/q, d/4/q, b/3/q, d/4/q',
          'g/3/q, d/4/q, g/2/q, d/3/q',
          // Разработка
          'a/3/q, e/4/q, c/4/q, e/4/q',
          'f/3/q, c/4/q, a/3/q, c/4/q',
          'g/3/q, d/4/q, b/3/q, d/4/q',
          'c/3/q, g/3/q, e/3/q, g/3/q',
          // Реприза
          'c/3/q, g/3/q, e/3/q, g/3/q',
          'c/3/q, g/3/q, e/3/q, g/3/q',
          'f/3/q, c/4/q, a/3/q, c/4/q',
          'g/3/q, d/4/q, b/3/q, d/4/q',
          'c/3/h, g/2/h',
          'c/3/w',
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
        title: 'Ode to Joy — Complete Theme (Symphony 9)',
        tempo: 116,
        treble: [
          // === Первое предложение ===
          'e/4/q, e/4/q, f/4/q, g/4/q',
          'g/4/q, f/4/q, e/4/q, d/4/q',
          'c/4/q, c/4/q, d/4/q, e/4/q',
          'e/4/h., d/4/q',
          // === Второе предложение ===
          'e/4/q, e/4/q, f/4/q, g/4/q',
          'g/4/q, f/4/q, e/4/q, d/4/q',
          'c/4/q, c/4/q, d/4/q, e/4/q',
          'd/4/h., c/4/q',
          // === Мост ===
          'd/4/q, d/4/q, e/4/q, c/4/q',
          'd/4/q, e/4/8, f/4/8, e/4/q, c/4/q',
          'd/4/q, e/4/8, f/4/8, e/4/q, d/4/q',
          'c/4/q, d/4/q, g/3/h',
          // === Финальное предложение ===
          'e/4/q, e/4/q, f/4/q, g/4/q',
          'g/4/q, f/4/q, e/4/q, d/4/q',
          'c/4/q, c/4/q, d/4/q, e/4/q',
          'd/4/h., c/4/q',
          // === Вариация с украшениями ===
          'e/4/8, f/4/8, e/4/8, f/4/8, g/4/q, g/4/q',
          'g/4/8, f/4/8, e/4/8, f/4/8, e/4/q, d/4/q',
          'c/4/8, d/4/8, c/4/8, d/4/8, e/4/q, e/4/q',
          'e/4/q, d/4/q, d/4/h',
          // === Coda ===
          'g/4/q, f/4/q, e/4/q, d/4/q',
          'c/4/q, d/4/q, e/4/q, f/4/q',
          'g/4/q, g/4/q, a/4/q, g/4/q',
          'f/4/q, e/4/q, d/4/q, e/4/q',
          'c/4/w',
        ],
        bass: [
          'c/3/q, e/3/q, g/3/q, e/3/q',
          'c/3/q, f/3/q, a/3/q, f/3/q',
          'c/3/q, e/3/q, g/3/q, e/3/q',
          'g/2/q, b/2/q, d/3/q, g/3/q',
          'c/3/q, e/3/q, g/3/q, e/3/q',
          'c/3/q, f/3/q, a/3/q, f/3/q',
          'c/3/q, e/3/q, g/3/q, e/3/q',
          'g/2/q, b/2/q, d/3/q, g/2/q',
          'g/2/q, b/2/q, d/3/q, b/2/q',
          'g/2/q, c/3/q, e/3/q, c/3/q',
          'g/2/q, b/2/q, d/3/q, b/2/q',
          'a/2/q, f#/2/q, g/2/h',
          'c/3/q, e/3/q, g/3/q, e/3/q',
          'c/3/q, f/3/q, a/3/q, f/3/q',
          'c/3/q, e/3/q, g/3/q, e/3/q',
          'g/2/q, b/2/q, d/3/q, g/2/q',
          'c/3/q, e/3/q, g/3/q, e/3/q',
          'c/3/q, f/3/q, a/3/q, f/3/q',
          'c/3/q, e/3/q, g/3/q, e/3/q',
          'g/2/q, b/2/q, d/3/q, g/2/q',
          'c/3/q, g/3/q, c/4/q, g/3/q',
          'f/3/q, a/3/q, c/4/q, a/3/q',
          'g/3/q, b/3/q, d/4/q, b/3/q',
          'c/3/q, e/3/q, g/3/q, c/3/q',
          'c/3/w',
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
        id: 'swan_lake_full',
        title: 'Swan Lake — Swan Theme (Act II)',
        tempo: 96,
        treble: [
          // === Главная тема (B-moll) — первое изложение ===
          'b/4/h, a/4/8, f#/4/8',
          'd/4/8, e/4/8, f#/4/h',
          'b/3/8, d/4/8, f#/4/h',
          'a/4/8, g/4/8, e/4/h',
          // === Повторение с нарастанием ===
          'b/4/h, a/4/8, f#/4/8',
          'd/4/8, e/4/8, f#/4/q, d/5/q',
          'e/5/h, d/5/8, b/4/8',
          'c#/5/h, a/4/h',
          // === Развитие — лирическое (D-dur) ===
          'd/5/q, c#/5/q, b/4/q, a/4/q',
          'g/4/h, f#/4/h',
          'e/4/q, f#/4/q, g/4/q, a/4/q',
          'b/4/w',
          // === Кульминация ===
          'd/5/q, e/5/q, f#/5/q, e/5/q',
          'd/5/q, c#/5/q, b/4/q, a/4/q',
          'g/4/q, a/4/q, b/4/q, c#/5/q',
          'd/5/h, f#/5/h',
          // === Возврат главной темы ===
          'b/4/h, a/4/8, f#/4/8',
          'd/4/8, e/4/8, f#/4/h',
          'b/3/8, d/4/8, f#/4/h',
          'a/4/h, f#/4/h',
          // === Coda — угасание ===
          'e/4/q, f#/4/q, g/4/q, f#/4/q',
          'e/4/h, d/4/h',
          'c#/4/q, d/4/q, e/4/h',
          'b/3/w',
        ],
        bass: [
          'b/2/q, f#/3/q, b/3/q, f#/3/q',
          'b/2/q, d/3/q, f#/3/q, d/3/q',
          'b/2/q, f#/3/q, b/3/q, f#/3/q',
          'e/3/q, g/3/q, b/3/q, g/3/q',
          'b/2/q, f#/3/q, b/3/q, f#/3/q',
          'b/2/q, d/3/q, f#/3/q, d/3/q',
          'e/3/q, b/3/q, g/3/q, b/3/q',
          'a/2/q, e/3/q, c#/3/q, e/3/q',
          'd/3/q, a/3/q, f#/3/q, a/3/q',
          'g/3/q, d/3/q, g/3/q, d/3/q',
          'a/2/q, e/3/q, c#/3/q, e/3/q',
          'b/2/q, f#/3/q, b/2/q, f#/3/q',
          'b/2/q, f#/3/q, b/3/q, f#/3/q',
          'd/3/q, a/3/q, f#/3/q, a/3/q',
          'e/3/q, b/3/q, g/3/q, b/3/q',
          'b/2/h, b/3/h',
          'b/2/q, f#/3/q, b/3/q, f#/3/q',
          'b/2/q, d/3/q, f#/3/q, d/3/q',
          'b/2/q, f#/3/q, b/3/q, f#/3/q',
          'e/3/q, g/3/q, e/3/q, g/3/q',
          'c#/3/q, g#/3/q, c#/3/q, g#/3/q',
          'f#/3/q, c#/3/q, a/2/q, c#/3/q',
          'g#/2/q, d#/3/q, g#/3/q, f#/3/q',
          'b/2/w',
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
        id: 'clair_de_lune_full',
        title: 'Clair de Lune — Suite bergamasque',
        tempo: 58,
        treble: [
          // === Вступление — Andante très expressif ===
          'r/h, f/5/q, e/5/q',
          'c/5/h., d/5/q',
          'c/5/h, a/4/h',
          'r/h, f/5/q, e/5/q',
          // === Вторая фраза ===
          'c/5/h., d/5/q',
          'bb/4/q, a/4/q, g/4/h',
          'f/4/q, g/4/q, a/4/h',
          'f/4/h, r/h',
          // === Центральная секция — Tempo rubato (più mosso) ===
          'f/5/8, e/5/8, d/5/8, c/5/8, bb/4/q, a/4/q',
          'g/4/q, f/4/q, g/4/q, a/4/q',
          'bb/4/8, c/5/8, d/5/8, e/5/8, f/5/q, g/5/q',
          'a/5/h, g/5/h',
          // Нарастание
          'f/5/q, e/5/q, d/5/q, c/5/q',
          'bb/4/q, a/4/q, g/4/q, f/4/q',
          'e/4/q, f/4/q, g/4/q, a/4/q',
          'bb/4/h, c/5/h',
          // === Кульминация ===
          'd/5/q, e/5/q, f/5/q, g/5/q',
          'a/5/q, g/5/q, f/5/q, e/5/q',
          'd/5/q, c/5/q, bb/4/q, a/4/q',
          'g/4/h, a/4/h',
          // === Возврат — Un poco mosso ===
          'r/h, f/5/q, e/5/q',
          'c/5/h., d/5/q',
          'c/5/h, a/4/h',
          // === Coda — pianissimo ===
          'f/4/q, g/4/q, a/4/q, bb/4/q',
          'c/5/q, bb/4/q, a/4/q, g/4/q',
          'f/4/h., e/4/q',
          'f/4/w',
        ],
        bass: [
          'f/3/q, a/3/q, c/4/q, a/3/q',
          'f/3/q, a/3/q, c/4/q, a/3/q',
          'f/3/q, a/3/q, c/4/q, a/3/q',
          'e/3/q, g/3/q, c/4/q, g/3/q',
          'f/3/q, a/3/q, c/4/q, a/3/q',
          'd/3/q, f/3/q, a/3/q, f/3/q',
          'bb/2/q, f/3/q, d/3/q, f/3/q',
          'f/3/q, a/3/q, c/4/q, a/3/q',
          'f/3/q, a/3/q, c/4/q, a/3/q',
          'd/3/q, a/3/q, f/3/q, a/3/q',
          'bb/2/q, f/3/q, d/3/q, f/3/q',
          'c/3/q, g/3/q, e/3/q, g/3/q',
          'f/3/q, a/3/q, c/4/q, a/3/q',
          'd/3/q, f/3/q, a/3/q, f/3/q',
          'e/3/q, g/3/q, c/4/q, g/3/q',
          'f/3/q, c/4/q, a/3/q, c/4/q',
          'bb/2/q, d/3/q, f/3/q, d/3/q',
          'c/3/q, e/3/q, g/3/q, e/3/q',
          'f/3/q, a/3/q, c/4/q, a/3/q',
          'e/3/q, g/3/q, c/4/q, g/3/q',
          'f/3/q, a/3/q, c/4/q, a/3/q',
          'f/3/q, a/3/q, c/4/q, a/3/q',
          'f/3/q, a/3/q, c/4/q, a/3/q',
          'd/3/q, f/3/q, a/3/q, f/3/q',
          'bb/2/q, d/3/q, f/3/q, d/3/q',
          'e/3/q, g/3/q, c/4/q, g/3/q',
          'f/3/w',
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
        id: 'rite_spring_full',
        title: 'The Rite of Spring — Opening Themes',
        tempo: 72,
        treble: [
          // === Вступление — сольная фагот-мелодия ===
          'c/5/8, b/4/8, g/4/8, e/4/8, b/4/q',
          'a/4/8, g/4/8, e/4/q, a/4/q',
          'g/4/8, e/4/8, d/4/q, g/4/q',
          'c/5/q, b/4/8, a/4/8, g/4/q, e/4/q',
          // === Развитие вступления ===
          'f/4/8, e/4/8, d/4/q, f/4/q',
          'e/4/q, d/4/q, c/4/h',
          'b/3/8, c/4/8, d/4/8, e/4/8, f/4/q, g/4/q',
          'a/4/h, g/4/h',
          // === Танец юных (Augurs of Spring) — политональный паттерн ===
          'e/5/q, e/5/q, e/5/q, eb/5/q',
          'e/5/8, eb/5/8, e/5/q, e/5/q, eb/5/q',
          'e/5/q, eb/5/q, e/5/q, r/q',
          'f/5/q, e/5/q, d/5/q, c/5/q',
          // === Весенняя хореографическая сцена ===
          'bb/4/q, a/4/q, ab/4/q, g/4/q',
          'f/4/q, e/4/q, d/4/q, c/4/q',
          'e/4/8, f/4/8, g/4/8, a/4/8, b/4/q, c/5/q',
          'd/5/h, c/5/h',
          // === Игра похищения (ритмический)===
          'c/5/8, b/4/8, c/5/8, b/4/8, c/5/q, r/q',
          'g/4/8, a/4/8, g/4/8, f/4/8, g/4/q, r/q',
          'c/5/8, r/8, c/5/8, r/8, d/5/8, r/8, e/5/8, r/8',
          'f/5/q, e/5/q, d/5/q, c/5/q',
          // === Финал — Весенние хороводы ===
          'e/5/q, f/5/q, g/5/q, a/5/q',
          'g/5/q, f/5/q, e/5/q, d/5/q',
          'c/5/q, d/5/q, e/5/q, f/5/q',
          'g/5/h, c/5/h',
        ],
        bass: [
          'c/3/w',
          'c/3/w',
          'c/3/w',
          'c/3/w',
          'f/3/q, c/3/q, f/3/q, c/3/q',
          'g/3/q, c/3/q, g/3/q, c/3/q',
          'f/3/q, c/3/q, g/3/q, c/3/q',
          'c/3/w',
          // Политональный — Eb-dur / E-dur
          'eb/3/q, bb/3/q, eb/3/q, bb/3/q',
          'eb/3/q, bb/3/q, eb/3/q, bb/3/q',
          'eb/3/q, bb/3/q, eb/3/q, bb/3/q',
          'eb/3/q, bb/3/q, eb/3/q, bb/3/q',
          'ab/2/q, eb/3/q, ab/2/q, eb/3/q',
          'g/2/q, d/3/q, g/2/q, d/3/q',
          'f/2/q, c/3/q, f/2/q, c/3/q',
          'c/3/q, g/3/q, c/3/q, g/2/q',
          // Ритмический
          'c/3/8, r/8, c/3/8, r/8, c/3/q, r/q',
          'f/3/8, r/8, f/3/8, r/8, f/3/q, r/q',
          'g/3/8, r/8, g/3/8, r/8, g/3/8, r/8, g/3/8, r/8',
          'c/3/q, g/3/q, c/3/q, g/2/q',
          'c/3/q, g/3/q, c/4/q, g/3/q',
          'f/3/q, c/4/q, f/3/q, c/3/q',
          'g/2/q, d/3/q, g/3/q, d/3/q',
          'c/3/w',
        ],
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
        id: 'piano_phase_full',
        title: 'Piano Phase — Complete Pattern (1967)',
        tempo: 184,
        // Минималистичный паттерн — 12 нот, повторяющихся со сдвигом фазы
        // Оригинальный паттерн: E-F#-B-C#-D-F#-E-C#-B-F#-D-C#
        treble: [
          'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
          'b/4/8, f#/4/8, d/5/8, c#/5/8, e/4/8, f#/4/8, b/4/8, c#/5/8',
          'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
          'b/4/8, f#/4/8, d/5/8, c#/5/8, b/4/8, f#/4/8, d/5/8, c#/5/8',
          // Фаза начинает смещаться
          'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
          'd/5/8, f#/4/8, e/4/8, c#/5/8, b/4/8, f#/4/8, d/5/8, c#/5/8',
          'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
          'c#/5/8, b/4/8, f#/4/8, d/5/8, c#/5/8, e/4/8, f#/4/8, b/4/8',
          // Полностью смещённая фаза
          'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
          'b/4/8, f#/4/8, d/5/8, c#/5/8, e/4/8, f#/4/8, b/4/8, c#/5/8',
          'e/4/8, f#/4/8, b/4/8, c#/5/8, d/5/8, f#/4/8, e/4/8, c#/5/8',
          'b/4/8, f#/4/8, d/5/8, c#/5/8, b/4/8, f#/4/8, d/5/8, c#/5/8',
        ],
        bass: [
          'e/3/8, r/8, b/3/8, r/8, d/4/8, r/8, e/3/8, r/8',
          'b/3/8, r/8, d/4/8, r/8, e/3/8, r/8, b/3/8, r/8',
          'e/3/8, r/8, b/3/8, r/8, d/4/8, r/8, e/3/8, r/8',
          'b/3/8, r/8, d/4/8, r/8, e/3/8, r/8, b/3/8, r/8',
          'e/3/8, r/8, b/3/8, r/8, d/4/8, r/8, e/3/8, r/8',
          'b/3/8, r/8, d/4/8, r/8, e/3/8, r/8, b/3/8, r/8',
          'e/3/8, r/8, b/3/8, r/8, d/4/8, r/8, e/3/8, r/8',
          'b/3/8, r/8, d/4/8, r/8, e/3/8, r/8, b/3/8, r/8',
          'e/3/8, r/8, b/3/8, r/8, d/4/8, r/8, e/3/8, r/8',
          'b/3/8, r/8, d/4/8, r/8, e/3/8, r/8, b/3/8, r/8',
          'e/3/8, r/8, b/3/8, r/8, d/4/8, r/8, e/3/8, r/8',
          'b/3/8, r/8, d/4/8, r/8, e/3/8, r/8, b/3/8, r/8',
        ],
      },
    ],
  },
];
