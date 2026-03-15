import * as PIXI from 'pixi.js';
import type { ComposerNode } from '../data/database';
import { GRID_Y, HORIZON_Y, ERA_Y_CENTER } from '../utils/layout';
import type { Era } from '../hooks/useAudioPlayer';

const ERA_ORDER: Era[] = ['Baroque', 'Classical', 'Romantic', '20th Century', 'Contemporary'];

const ERA_COLORS: Record<Era, number> = {
  Baroque:         0xF4A460,
  Classical:       0x87CEEB,
  Romantic:        0xD4695F,
  '20th Century':  0xA9A9A9,
  Contemporary:    0xFFD700,
};

// Горизонтальный диапазон полос (шире чем самый правый композитор x=15 → worldX=13700)
const BAND_X_START = -1000;
const BAND_X_END   = 15000;

// Расстояние между линиями стана (px в мировых координатах)
const STAFF_LINE_SPACING = 12;

/**
 * Рисует горизонтальные дороги-станы (одна полоса на эпоху),
 * каждая состоит из 5 параллельных линий нотного стана с рассеянными нотками.
 */
export class StaveRoadLayer extends PIXI.Container {
  private graphics: PIXI.Graphics;
  private labelContainer: PIXI.Container;

  constructor() {
    super();

    this.graphics = new PIXI.Graphics();
    this.addChild(this.graphics);

    this.labelContainer = new PIXI.Container();
    this.addChild(this.labelContainer);

    this.draw();
  }

  // No-op: горизонтальные станы не зависят от конкретных пар композиторов
  setHoveredRoad(_index: number | null): void {}
  updateRoads(_composers: ComposerNode[]): void {}

  private draw(): void {
    this.graphics.clear();
    this.labelContainer.removeChildren();

    ERA_ORDER.forEach((era) => {
      const centerY = HORIZON_Y + ERA_Y_CENTER[era] * GRID_Y;
      const color = ERA_COLORS[era];

      // 5 горизонтальных линий стана (смещения: ±24, ±12, 0)
      const offsets = [-2, -1, 0, 1, 2].map(i => i * STAFF_LINE_SPACING);
      offsets.forEach((offset) => {
        this.graphics.moveTo(BAND_X_START, centerY + offset);
        this.graphics.lineTo(BAND_X_END,   centerY + offset);
        this.graphics.stroke({ color, width: 1.5, alpha: 0.3 });
      });

      // Нотные точки (детерминированные — не случайные)
      let seed = era.charCodeAt(0) * 31 + era.length;
      for (let x = BAND_X_START + 120; x < BAND_X_END; x += 200) {
        // LCG pseudo-random для детерминированного разброса
        seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
        const lineIdx = seed % 5;
        const dotY = centerY + offsets[lineIdx];
        this.graphics.circle(x, dotY, 4);
        this.graphics.fill({ color, alpha: 0.2 });
      }

      // Метки эпох вдоль полосы (каждые 2500px)
      for (let labelX = BAND_X_START + 300; labelX < BAND_X_END; labelX += 2500) {
        const label = new PIXI.Text({
          text: era.toUpperCase(),
          style: {
            fontFamily: 'serif',
            fontSize: 13,
            fontStyle: 'italic',
            fill: color,
            letterSpacing: 6,
          },
        });
        label.alpha = 0.45;
        label.anchor.set(0, 0.5);
        label.position.set(labelX, centerY - STAFF_LINE_SPACING * 2 - 18);
        this.labelContainer.addChild(label);
      }
    });
  }
}
