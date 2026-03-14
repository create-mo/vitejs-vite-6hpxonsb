import * as PIXI from 'pixi.js';
import type { ComposerNode } from '../data/database';
import { GRID_X, GRID_Y, HORIZON_Y } from '../utils/layout';

interface ComposerDisplay {
  node: ComposerNode;
  container: PIXI.Container;
  dotGraphics: PIXI.Graphics;
  textLabel: PIXI.Text;
  currentLOD: 'dot' | 'label' | 'portrait';
}

/**
 * Рендерит узлы композиторов с LOD системой:
 * - LOD 1 (zoom < 0.4): маленькая точка (12px)
 * - LOD 2 (0.4-0.7): точка + имя + годы
 * - LOD 3 (zoom > 0.7): портрет с полным именем (на canvas/DOM оверлей)
 */
export class ComposerLayer extends PIXI.Container {
  private displays: Map<string, ComposerDisplay> = new Map();
  private lastZoom: number = 1;

  constructor() {
    super();
  }

  /**
   * Обновляет список композиторов
   */
  updateComposers(composers: ComposerNode[]): void {
    // Очищаем старые дисплеи
    this.displays.forEach((display) => {
      this.removeChild(display.container);
    });
    this.displays.clear();

    // Создаём новые дисплеи
    composers.forEach((node) => {
      const display = this.createComposerDisplay(node);
      this.displays.set(node.id, display);
      this.addChild(display.container);
    });
  }

  /**
   * Создаёт дисплей для одного композитора
   */
  private createComposerDisplay(node: ComposerNode): ComposerDisplay {
    const container = new PIXI.Container();
    const worldX = node.x * GRID_X + 200;
    const worldY = HORIZON_Y + node.y * GRID_Y;
    container.position.set(worldX, worldY);

    // Нормализуем цвет эры в hex
    const eraColorMap: Record<string, number> = {
      Baroque: 0x8b4513,        // коричневый
      Classical: 0x4169e1,      // королевский синий
      Romantic: 0xdc143c,       // малиновый
      '20th Century': 0x556b2f, // оливковый
      Contemporary: 0x9932cc,   // тёмный орхидей
    };
    const eraColor = eraColorMap[node.era] || 0x999999;

    // LOD 1: точка
    const dotGraphics = new PIXI.Graphics();
    dotGraphics.circle(0, 0, 6); // радиус 6px
    dotGraphics.fill({ color: eraColor, alpha: 0.8 });
    container.addChild(dotGraphics);

    // LOD 2: текстовой label (фамилия + годы)
    const textLabel = new PIXI.Text({
      text: `${node.label.split(' ').pop()}\n(${node.life_dates})`,
      style: {
        fontSize: 10,
        fill: 0xe5e5e5,
        fontWeight: 'bold',
        align: 'center',
      },
    });
    textLabel.anchor.set(0.5, 0);
    textLabel.position.set(0, 12);
    textLabel.visible = false;
    container.addChild(textLabel);

    return {
      node,
      container,
      dotGraphics,
      textLabel,
      currentLOD: 'dot',
    };
  }

  /**
   * Обновляет LOD в зависимости от zoom уровня
   */
  updateLODByZoom(scale: number): void {
    if (Math.abs(scale - this.lastZoom) < 0.01) return;
    this.lastZoom = scale;

    this.displays.forEach((display) => {
      let newLOD: 'dot' | 'label' | 'portrait' = 'dot';

      if (scale > 0.7) {
        newLOD = 'portrait'; // DOM overlay будет отображать портреты
      } else if (scale > 0.4) {
        newLOD = 'label';
      } else {
        newLOD = 'dot';
      }

      if (newLOD !== display.currentLOD) {
        this.applyLOD(display, newLOD);
      }
    });
  }

  /**
   * Применяет LOD к дисплею
   */
  private applyLOD(display: ComposerDisplay, lod: 'dot' | 'label' | 'portrait'): void {
    display.currentLOD = lod;

    // Показываем/скрываем элементы в зависимости от LOD
    display.dotGraphics.visible = lod !== 'portrait';
    display.textLabel.visible = lod === 'label';

    if (lod === 'portrait') {
      // Скрываем PixiJS элементы, DOM overlay покажет портрет
      display.container.alpha = 0.1; // едва видимо
    } else {
      display.container.alpha = 1;
    }
  }

  /**
   * Выделяет композитора (например при клике)
   */
  highlightComposer(composerId: string | null): void {
    this.displays.forEach((display) => {
      if (display.node.id === composerId) {
        // Добавляем glow эффект
        display.dotGraphics.tint = 0xd4af37; // Gold
        display.container.scale.set(1.2);
      } else {
        display.dotGraphics.tint = 0xffffff; // Reset
        display.container.scale.set(1);
      }
    });
  }
}
