import type { Era } from '../hooks/useAudioPlayer';

/**
 * Историческая карта: определяет координаты, цвета и контекст для каждой музыкальной эпохи
 */

export interface EraRegion {
  name: Era;
  /** Границы региона в координатах мира (X) */
  bounds: {
    x1: number; // начало эпохи
    x2: number; // конец эпохи
    y1: number; // верхняя граница
    y2: number; // нижняя граница
  };
  /** Основной цвет эпохи */
  color: string;
  /** HEX для более темного акцента */
  accentColor: string;
  /** URL фонового изображения (историческая архитектура/искусство) */
  backgroundImage?: string;
  /** Прозрачность фона (0-1) */
  opacityBg: number;
  /** Исторический контекст, появляется при наведении */
  historicalContext: string;
  /** Десятилетие (для разделителей) */
  decades: string;
}

/**
 * Мировые координаты X:
 * - Baroque: 1600-1750 → X: 0-150
 * - Classical: 1750-1820 → X: 150-300
 * - Romantic: 1820-1900 → X: 300-450
 * - 20th Century: 1900-1950 → X: 450-550
 * - Contemporary: 1950+ → X: 550-700
 */

export const ERA_REGIONS: Record<Era, EraRegion> = {
  Baroque: {
    name: 'Baroque',
    bounds: {
      x1: -10,
      x2: 150,
      y1: -250,
      y2: 250,
    },
    color: '#F4A460', // Sandy Brown
    accentColor: '#D2691E',
    backgroundImage: undefined, // Versailles image URL (optional)
    opacityBg: 0.08,
    historicalContext: 'BAROQUE (1600–1750) | Royal courts of Europe, ornamental splendor',
    decades: '1600 1650 1700 1750',
  },

  Classical: {
    name: 'Classical',
    bounds: {
      x1: 150,
      x2: 300,
      y1: -250,
      y2: 250,
    },
    color: '#87CEEB', // Sky Blue
    accentColor: '#4682B4',
    backgroundImage: undefined, // Parthenon image URL (optional)
    opacityBg: 0.08,
    historicalContext: 'CLASSICAL (1750–1820) | Age of Enlightenment, balance and form',
    decades: '1750 1780 1800 1820',
  },

  Romantic: {
    name: 'Romantic',
    bounds: {
      x1: 300,
      x2: 450,
      y1: -250,
      y2: 250,
    },
    color: '#D4695F', // Rust Red
    accentColor: '#8B3A3A',
    backgroundImage: undefined, // Romantic landscape image URL (optional)
    opacityBg: 0.08,
    historicalContext: 'ROMANTIC (1820–1900) | Nature, emotion, and individual expression',
    decades: '1820 1850 1875 1900',
  },

  '20th Century': {
    name: '20th Century',
    bounds: {
      x1: 450,
      x2: 550,
      y1: -250,
      y2: 250,
    },
    color: '#A9A9A9', // Dark Gray
    accentColor: '#696969',
    backgroundImage: undefined, // Modernist architecture image URL (optional)
    opacityBg: 0.08,
    historicalContext: '20TH CENTURY (1900–1950) | Modernism, experimentation, technological change',
    decades: '1900 1920 1945',
  },

  Contemporary: {
    name: 'Contemporary',
    bounds: {
      x1: 550,
      x2: 700,
      y1: -250,
      y2: 250,
    },
    color: '#FFD700', // Gold
    accentColor: '#DAA520',
    backgroundImage: undefined, // Digital/abstract image URL (optional)
    opacityBg: 0.08,
    historicalContext: 'CONTEMPORARY (1950+) | Digital era, global fusion, infinite possibilities',
    decades: '1950 1980 2000 2020',
  },
};

/**
 * Получить регион по X-координате композитора
 */
export const getEraRegionByX = (x: number): EraRegion | null => {
  for (const era of Object.values(ERA_REGIONS)) {
    if (x >= era.bounds.x1 && x <= era.bounds.x2) {
      return era;
    }
  }
  return null;
};

/**
 * Получить регион по имени эры
 */
export const getEraRegion = (era: Era): EraRegion => {
  return ERA_REGIONS[era];
};

/**
 * Все границы в порядке хронологии
 */
export const ERA_DIVIDERS = [
  { x: 150, label: '1750', from: 'Baroque', to: 'Classical' },
  { x: 300, label: '1820', from: 'Classical', to: 'Romantic' },
  { x: 450, label: '1900', from: 'Romantic', to: '20th Century' },
  { x: 550, label: '1950', from: '20th Century', to: 'Contemporary' },
];
