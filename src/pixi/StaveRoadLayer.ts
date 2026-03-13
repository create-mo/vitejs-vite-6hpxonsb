import * as PIXI from 'pixi.js';
import { ComposerNode } from '../data/database';
import { GRID_X, GRID_Y, HORIZON_Y } from '../utils/layout';

interface RoadSegment {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startComposer: ComposerNode;
  endComposer: ComposerNode;
}

/**
 * Рендерит дороги между композиторами как музыкальные станы (5 линий)
 * с рассеянными нотками вдоль дороги
 */
export class StaveRoadLayer extends PIXI.Container {
  private graphics: PIXI.Graphics;
  private graphicsHover: PIXI.Graphics;
  private noteSprites: PIXI.Container;
  private labels: PIXI.Container;
  private roads: RoadSegment[] = [];
  private hoveredRoadIndex: number | null = null;

  constructor() {
    super();

    // Графика для линий станов (основной слой)
    this.graphics = new PIXI.Graphics();
    this.addChild(this.graphics);

    // Графика для подсветки при наведении (поверх основного)
    this.graphicsHover = new PIXI.Graphics();
    this.addChild(this.graphicsHover);

    // Контейнер для нотных точек (для возможности использовать ParticleContainer в будущем)
    this.noteSprites = new PIXI.Container();
    this.addChild(this.noteSprites);

    // Контейнер для лейблов эр
    this.labels = new PIXI.Container();
    this.addChild(this.labels);
  }

  setHoveredRoad(index: number | null): void {
    if (this.hoveredRoadIndex === index) return;
    this.hoveredRoadIndex = index;
    this.redrawHoverLayer();
  }

  /**
   * Обновляет дороги на основе текущего списка композиторов
   */
  updateRoads(composers: ComposerNode[]): void {
    this.roads = [];

    composers.forEach((node) => {
      node.predecessors.forEach((predId) => {
        const pred = composers.find((c) => c.id === predId);
        if (!pred) return;

        this.roads.push({
          startX: pred.x * GRID_X + 200 + 60, // Смещение на длину круга
          startY: HORIZON_Y + pred.y * GRID_Y,
          endX: node.x * GRID_X + 200,
          endY: HORIZON_Y + node.y * GRID_Y,
          startComposer: pred,
          endComposer: node,
        });
      });
    });

    this.redraw();
  }

  /**
   * Перерисовывает все дороги и нотки
   */
  private redraw(): void {
    this.graphics.clear();
    this.graphicsHover.clear();
    this.noteSprites.removeChildren();
    this.labels.removeChildren();

    this.roads.forEach((road, idx) => {
      this.drawStaveRoad(road, idx === this.hoveredRoadIndex);
      this.addEraLabel(road);
    });
  }

  /**
   * Перерисовывает слой подсветки при наведении
   */
  private redrawHoverLayer(): void {
    this.graphicsHover.clear();

    if (this.hoveredRoadIndex !== null && this.hoveredRoadIndex < this.roads.length) {
      const road = this.roads[this.hoveredRoadIndex];
      const { startX, startY, endX, endY } = road;

      // Вычисляем Bezier кривую (S-curve)
      const controlX1 = startX + (endX - startX) * 0.33;
      const controlY1 = startY;
      const controlX2 = startX + (endX - startX) * 0.67;
      const controlY2 = endY;

      // 5 линий станов параллельно кривой (смещены ±10, ±5, 0 px)
      const staffOffsets = [-10, -5, 0, 5, 10];
      const staffColor = 0xd4af37; // золотой
      const staffAlpha = 0.8; // ярче при наведении

      staffOffsets.forEach((offset) => {
        // Рисуем Bezier кривую с смещением
        const points = this.getBezierCurvePoints(startX, startY + offset, controlX1, controlY1 + offset, controlX2, controlY2 + offset, endX, endY + offset, 20);

        if (points.length > 1) {
          for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            this.graphicsHover.moveTo(p1.x, p1.y);
            this.graphicsHover.lineTo(p2.x, p2.y);
            this.graphicsHover.stroke({ color: staffColor, width: 2, alpha: staffAlpha });
          }
        }
      });
    }
  }

  /**
   * Рисует одну дорогу-стан (5 параллельных линий + нотки)
   */
  private drawStaveRoad(road: RoadSegment, isHovered: boolean = false): void {
    const { startX, startY, endX, endY } = road;

    // Вычисляем Bezier кривую (S-curve)
    const controlX1 = startX + (endX - startX) * 0.33;
    const controlY1 = startY;
    const controlX2 = startX + (endX - startX) * 0.67;
    const controlY2 = endY;

    // 5 линий станов параллельно кривой (смещены ±10, ±5, 0 px)
    const staffOffsets = [-10, -5, 0, 5, 10];
    const staffColor = 0xaaaaaa; // серый
    const staffAlpha = isHovered ? 0.2 : 0.4; // затемняем при наведении на другую дорогу

    staffOffsets.forEach((offset) => {
      // Рисуем Bezier кривую с смещением
      const points = this.getBezierCurvePoints(startX, startY + offset, controlX1, controlY1 + offset, controlX2, controlY2 + offset, endX, endY + offset, 20);

      if (points.length > 1) {
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];
          this.graphics.moveTo(p1.x, p1.y);
          this.graphics.lineTo(p2.x, p2.y);
          this.graphics.stroke({ color: staffColor, width: 1, alpha: staffAlpha });
        }
      }
    });

    // Добавляем нотные точки вдоль дороги
    this.addNoteDotsAlongRoad(road);
  }

  /**
   * Вычисляет точки Bezier кривой
   */
  private getBezierCurvePoints(
    x1: number,
    y1: number,
    cx1: number,
    cy1: number,
    cx2: number,
    cy2: number,
    x2: number,
    y2: number,
    steps: number
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];

    for (let t = 0; t <= 1; t += 1 / steps) {
      const mt = 1 - t;
      const x =
        mt * mt * mt * x1 +
        3 * mt * mt * t * cx1 +
        3 * mt * t * t * cx2 +
        t * t * t * x2;
      const y =
        mt * mt * mt * y1 +
        3 * mt * mt * t * cy1 +
        3 * mt * t * t * cy2 +
        t * t * t * y2;
      points.push({ x, y });
    }

    return points;
  }

  /**
   * Добавляет нотные точки вдоль дороги
   */
  private addNoteDotsAlongRoad(road: RoadSegment): void {
    const { startX, startY, endX, endY } = road;
    const numDots = Math.max(3, Math.floor(Math.abs(endX - startX) / 100));

    for (let i = 0; i < numDots; i++) {
      const t = i / (numDots - 1);
      // Позиция на дороге
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;

      // Случайное смещение вверх/вниз на ±8px для рассеивания
      const offsetY = (Math.random() - 0.5) * 16;

      // Рисуем маленький круг (нотка)
      const dot = new PIXI.Graphics();
      dot.circle(0, 0, 4); // радиус 4px
      dot.fill({ color: 0x333333, alpha: 0.6 });
      dot.position.set(x, y + offsetY);

      this.noteSprites.addChild(dot);
    }
  }

  /**
   * Добавляет лейбл эры в середину дороги
   */
  private addEraLabel(road: RoadSegment): void {
    const { startX, startY, endX, endY, endComposer } = road;

    // Позиция в середине дороги
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    // Создаем текстовый лейбл
    const text = new PIXI.Text({
      text: endComposer.era,
      style: {
        fontFamily: 'SF Pro Display, Roboto, sans-serif',
        fontSize: 11,
        fontWeight: '600',
        fill: '#d4af37',
        alpha: 0.6,
      },
    });

    text.position.set(midX, midY - 15);
    text.anchor.set(0.5, 0.5);

    // Добавляем фоновый прямоугольник для читаемости
    const bg = new PIXI.Graphics();
    bg.rect(-text.width / 2 - 4, -text.height / 2 - 2, text.width + 8, text.height + 4);
    bg.fill({ color: 0x1a1a1a, alpha: 0.7 });
    bg.position.set(midX, midY - 15);

    this.labels.addChild(bg);
    this.labels.addChild(text);
  }
}
