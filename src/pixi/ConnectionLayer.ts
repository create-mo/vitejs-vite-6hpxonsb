import * as PIXI from 'pixi.js';
import { ComposerNode } from '../data/database';
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
      // Для каждого композитора рисуем связи к его предшественникам
      const fromX = node.x * GRID_X + 200;
      const fromY = HORIZON_Y + node.y * GRID_Y;

      node.predecessors.forEach((predId) => {
        const pred = composers.find((c) => c.id === predId);
        if (!pred) return;

        const toX = pred.x * GRID_X + 200 + 60; // Смещение
        const toY = HORIZON_Y + pred.y * GRID_Y;

        // Рисуем простую линию (пока без strength-информации,
        // так как в текущей схеме данных predecessors — это просто массив ID)
        // Для будущих версий можно добавить graph_connections структуру
        const thickness = 1.5;
        const color = 0x888888; // Серый цвет для дорог предков
        const alpha = 0.3;

        this.graphics.moveTo(toX, toY);
        this.graphics.lineTo(fromX, fromY);
        this.graphics.stroke({ color, width: thickness, alpha });
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

      // Выделяем связи к целевому узлу (яркие золотые)
      if (node.id === composerId || node.predecessors.includes(composerId)) {
        const thickness = 2.5;
        const color = 0xd4af37; // Gold
        const alpha = 0.7;

        this.graphics.moveTo(toX, toY);
        this.graphics.lineTo(fromX, fromY);
        this.graphics.stroke({ color, width: thickness, alpha });
      } else {
        // Остальные связи становятся более прозрачными
        const thickness = 1;
        const color = 0x666666; // Тёмный серый
        const alpha = 0.15;

        this.graphics.moveTo(toX, toY);
        this.graphics.lineTo(fromX, fromY);
        this.graphics.stroke({ color, width: thickness, alpha });
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
