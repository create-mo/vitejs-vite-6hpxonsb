import * as PIXI from 'pixi.js';
import { ComposerNode } from '../data/database';
import { GRID_X, GRID_Y, HORIZON_Y } from '../utils/layout';

/**
 * Главный контейнер мира, содержит все визуальные слои:
 * - Era backgrounds
 * - StaveRoads
 * - Composer nodes
 * - Connections
 * - Milestones
 */
export class WorldContainer extends PIXI.Container {
  private eraLayer: PIXI.Container;
  private staveRoadLayer: PIXI.Container;
  private composerLayer: PIXI.Container;
  private connectionLayer: PIXI.Container;
  private milestoneLayer: PIXI.Container;

  constructor() {
    super();

    // Инициализируем слои (порядок: от фона к переднему плану)
    this.eraLayer = new PIXI.Container();
    this.addChild(this.eraLayer);

    this.staveRoadLayer = new PIXI.Container();
    this.addChild(this.staveRoadLayer);

    this.milestoneLayer = new PIXI.Container();
    this.addChild(this.milestoneLayer);

    this.connectionLayer = new PIXI.Container();
    this.addChild(this.connectionLayer);

    this.composerLayer = new PIXI.Container();
    this.addChild(this.composerLayer);
  }

  // Геттеры для доступа к слоям
  getEraLayer(): PIXI.Container {
    return this.eraLayer;
  }

  getStaveRoadLayer(): PIXI.Container {
    return this.staveRoadLayer;
  }

  getComposerLayer(): PIXI.Container {
    return this.composerLayer;
  }

  getConnectionLayer(): PIXI.Container {
    return this.connectionLayer;
  }

  getMilestoneLayer(): PIXI.Container {
    return this.milestoneLayer;
  }

  /**
   * Получить мировую координату для композитора
   */
  static getWorldPos(node: ComposerNode): { x: number; y: number } {
    return {
      x: node.x * GRID_X + 200,
      y: HORIZON_Y + node.y * GRID_Y,
    };
  }
}
