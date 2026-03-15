import * as PIXI from 'pixi.js';
import type { ComposerNode } from '../data/database';
import { GRID_X, GRID_Y, HORIZON_Y } from '../utils/layout';

/**
 * Рендерит нити влияния между композиторами
 * Толщина и цвет линии зависит от "strength" (значения влияния)
 */
export class ConnectionLayer extends PIXI.Container {
  private graphics: PIXI.Graphics;

  constructor() {
    super();
    this.graphics = new PIXI.Graphics();
    this.addChild(this.graphics);
  }

  /**
   * Обновляет нити влияния на основе данных композиторов
   */
  updateConnections(composers: ComposerNode[]): void {
    this.graphics.clear();

    composers.forEach((node) => {
      const fromX = node.x * GRID_X + 200;
      const fromY = HORIZON_Y + node.y * GRID_Y;

      node.predecessors.forEach((predId) => {
        const pred = composers.find((c) => c.id === predId);
        if (!pred) return;

        const toX = pred.x * GRID_X + 200;
        const toY = HORIZON_Y + pred.y * GRID_Y;

        const dx = fromX - toX;
        const dy = fromY - toY;

        // Плавные Bezier «нити» — контрольные точки выходят горизонтально
        // из обоих узлов, создавая мягкую S-кривую (стиль «золотые нити»)
        const tension = 0.45;
        const cp1x = toX + dx * tension;
        const cp1y = toY;
        const cp2x = fromX - dx * tension;
        const cp2y = fromY;

        this.graphics.moveTo(toX, toY);
        this.graphics.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, fromX, fromY);
        this.graphics.stroke({ color: 0xd4af37, width: 1.5, alpha: 0.5 });
      });
    });
  }

  /**
   * Выделяет все связи для конкретного композитора
   * (используется при наведении мыши или клике)
   */
  highlightComposerConnections(composerId: string, composers: ComposerNode[]): void {
    this.graphics.clear();

    const targetNode = composers.find((c) => c.id === composerId);
    if (!targetNode) return;

    const fromX = targetNode.x * GRID_X + 200;
    const fromY = HORIZON_Y + targetNode.y * GRID_Y;

    composers.forEach((node) => {
      const toX = node.x * GRID_X + 200 + 60;
      const toY = HORIZON_Y + node.y * GRID_Y;

      const dx = fromX - toX;
      const cp1x = toX + dx * 0.45;
      const cp2x = fromX - dx * 0.45;

      if (node.id === composerId || node.predecessors.includes(composerId)) {
        this.graphics.moveTo(toX, toY);
        this.graphics.bezierCurveTo(cp1x, toY, cp2x, fromY, fromX, fromY);
        this.graphics.stroke({ color: 0xd4af37, width: 2.5, alpha: 0.8 });
      } else {
        this.graphics.moveTo(toX, toY);
        this.graphics.bezierCurveTo(cp1x, toY, cp2x, fromY, fromX, fromY);
        this.graphics.stroke({ color: 0xd4af37, width: 1.0, alpha: 0.12 });
      }
    });
  }

  /**
   * Сбрасывает выделение (возвращает нормальный вид)
   */
  clearHighlight(composers: ComposerNode[]): void {
    this.updateConnections(composers);
  }
}
