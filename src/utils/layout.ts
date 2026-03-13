import { ComposerNode } from '../data/database';
import type { Era } from '../hooks/useAudioPlayer';

// Layout параметры (совпадают с дизайном)
export const GRID_X = 900;        // Пиксели на единицу X (время)
export const GRID_Y = 200;        // Пиксели на единицу Y
export const WORLD_HEIGHT = 1200; // Весь контент должен помещаться
export const HORIZON_Y = WORLD_HEIGHT / 2;

const ERA_ORDER: Era[] = ['Baroque', 'Classical', 'Romantic', '20th Century', 'Contemporary'];
const ERA_Y_CENTER: Record<Era, number> = {
  'Baroque': 0,
  'Classical': 0.15,
  'Romantic': 0.3,
  '20th Century': 0.45,
  'Contemporary': 0.6,
};

const CLUSTER_THRESHOLD = 0.3; // X units: композиторы "одновременны"
const CLUSTER_SPREAD = 0.6;    // Раскрытие кластера по X
const CLUSTER_STEP = 0.4;      // Y шаг между синхронными авторами

/**
 * Компактное дерево — раскрывает кластеры синхронных композиторов
 * по X (горизонтально) и Y (вертикально), чтобы всё было видно на экране
 */
export function smartCityLayout(composers: ComposerNode[]): ComposerNode[] {
  const result: ComposerNode[] = [];

  for (const era of ERA_ORDER) {
    const eraComps = composers.filter(c => c.era === era).sort((a, b) => a.x - b.x);
    if (!eraComps.length) continue;

    const baseY = ERA_Y_CENTER[era] ?? 0;

    // Группируем в кластеры по X-близости
    const clusters: ComposerNode[][] = [];
    let current: ComposerNode[] = [eraComps[0]];

    for (let i = 1; i < eraComps.length; i++) {
      if (eraComps[i].x - eraComps[i - 1].x < CLUSTER_THRESHOLD) {
        current.push(eraComps[i]);
      } else {
        clusters.push(current);
        current = [eraComps[i]];
      }
    }
    clusters.push(current);

    // Для каждого кластера: раскрываем по X и Y
    for (const cluster of clusters) {
      const n = cluster.length;
      const centerX = cluster.reduce((sum, c) => sum + c.x, 0) / n;

      cluster.forEach((c, i) => {
        // Раскрываем по X
        const xSpread = n === 1 ? 0 : (i - (n - 1) / 2) * CLUSTER_SPREAD;
        const newX = centerX + xSpread;

        // Раскрываем по Y
        const ySpread = n === 1 ? 0 : (i - (n - 1) / 2) * CLUSTER_STEP;
        const clampedYOffset = Math.max(-0.8, Math.min(0.8, ySpread));

        result.push({ ...c, x: newX, y: baseY + clampedYOffset });
      });
    }
  }

  // Fallback для композиторов с неизвестной эрой
  const handled = new Set(result.map(c => c.id));
  composers.filter(c => !handled.has(c.id)).forEach(c => result.push(c));

  return result;
}

/**
 * Подключает всех композиторов без связей через smart road connect:
 * 1. Спина эры (ближайший в одной эре)
 * 2. Мост между эрами
 */
export function smartRoadConnect(composers: ComposerNode[]): ComposerNode[] {
  const sorted = [...composers].sort((a, b) => a.x - b.x);

  return sorted.map((c) => {
    if (c.predecessors.length > 0) return c;

    const preds: string[] = [];

    // 1. Спина эры: найти ближайшего предшественника в одной эре (по X слева)
    const sameEra = sorted.filter(c2 => c2.era === c.era && c2.x < c.x);
    if (sameEra.length > 0) {
      preds.push(sameEra[sameEra.length - 1].id); // самый близкий слева
    }

    // 2. Мост между эрами: если первый в эре, связать с последним композитором предыдущей эры
    const eraIdx = ERA_ORDER.indexOf(c.era);
    if (eraIdx > 0 && sameEra.length === 0) {
      const prevEra = ERA_ORDER[eraIdx - 1];
      const prevEraComps = sorted.filter(c2 => c2.era === prevEra);
      if (prevEraComps.length > 0) {
        preds.push(prevEraComps[prevEraComps.length - 1].id);
      }
    }

    return preds.length > 0 ? { ...c, predecessors: preds } : c;
  });
}

/**
 * Вычисляет экранные координаты для узла
 */
export function getNodeScreenPos(
  node: ComposerNode,
  scale: number = 1
): { screenX: number; screenY: number } {
  return {
    screenX: (node.x * GRID_X + 200) * scale,
    screenY: (HORIZON_Y + node.y * GRID_Y) * scale,
  };
}
