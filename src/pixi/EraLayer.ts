import * as PIXI from 'pixi.js';
import { ERA_REGIONS } from '../lib/eraMap';
import { GRID_X, GRID_Y, HORIZON_Y } from '../utils/layout';

/**
 * Рендерит фоновые регионы эпох с адаптивной прозрачностью при зуме
 */
export class EraLayer extends PIXI.Container {
  private graphics: PIXI.Graphics;
  private lastScale: number = 1;

  constructor() {
    super();
    this.graphics = new PIXI.Graphics();
    this.addChild(this.graphics);
    this.draw();
  }

  /**
   * Рисует фоновые прямоугольники для каждой эпохи
   */
  private draw(): void {
    this.graphics.clear();

    Object.values(ERA_REGIONS).forEach((era) => {
      const x1 = era.bounds.x1 * GRID_X + 200;
      const x2 = era.bounds.x2 * GRID_X + 200;
      const y1 = HORIZON_Y + era.bounds.y1 * GRID_Y;
      const y2 = HORIZON_Y + era.bounds.y2 * GRID_Y;
      const width = x2 - x1;
      const height = y2 - y1;

      // Преобразуем hex цвет в число
      const color = parseInt(era.color.replace('#', ''), 16);

      // Рисуем прямоугольник с цветом и прозрачностью эпохи
      this.graphics.rect(x1, y1, width, height);
      this.graphics.fill({ color, alpha: era.opacityBg });
    });
  }

  /**
   * Обновляет прозрачность в зависимости от масштаба камеры
   * При отдалении (zoom < 0.4) становится более прозрачным
   * При приближении (zoom > 0.8) становится более видимым
   */
  updateOpacityByZoom(scale: number): void {
    if (Math.abs(scale - this.lastScale) < 0.01) return; // Не обновляем если изменение минимально

    this.lastScale = scale;

    // Интерполируем opacity: [0.2...0.4] → [minOpacity...maxOpacity]
    const minZoom = 0.2;
    const maxZoom = 1.5;
    const zoomFactor = Math.max(0, Math.min(1, (scale - minZoom) / (maxZoom - minZoom)));

    // При маленьком зуме полупрозрачно, при большом более видно
    const alphaMultiplier = 0.5 + zoomFactor * 0.5; // [0.5...1.0]

    this.alpha = alphaMultiplier;
  }
}
