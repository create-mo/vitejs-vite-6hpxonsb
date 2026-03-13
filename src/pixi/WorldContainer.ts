import * as PIXI from 'pixi.js';
import { ComposerNode } from '../data/database';
import { GRID_X, GRID_Y, HORIZON_Y } from '../utils/layout';
import { EraLayer } from './EraLayer';
import { StaveRoadLayer } from './StaveRoadLayer';
import { ComposerLayer } from './ComposerLayer';
import { ConnectionLayer } from './ConnectionLayer';

/**
 * Главный контейнер мира, содержит все визуальные слои:
 * - Era backgrounds (фоновые регионы эпох)
 * - StaveRoads (дороги-станы между композиторами)
 * - Connections (нити влияния)
 * - Composer nodes (узлы композиторов с LOD системой)
 */
export class WorldContainer extends PIXI.Container {
  private eraLayer: EraLayer;
  private staveRoadLayer: StaveRoadLayer;
  private composerLayer: ComposerLayer;
  private connectionLayer: ConnectionLayer;

  constructor() {
    super();

    // Инициализируем слои в порядке: от фона к переднему плану
    this.eraLayer = new EraLayer();
    this.addChild(this.eraLayer);

    this.staveRoadLayer = new StaveRoadLayer();
    this.addChild(this.staveRoadLayer);

    this.connectionLayer = new ConnectionLayer();
    this.addChild(this.connectionLayer);

    this.composerLayer = new ComposerLayer();
    this.addChild(this.composerLayer);
  }

  // Геттеры для доступа к слоям
  getEraLayer(): EraLayer {
    return this.eraLayer;
  }

  getStaveRoadLayer(): StaveRoadLayer {
    return this.staveRoadLayer;
  }

  getComposerLayer(): ComposerLayer {
    return this.composerLayer;
  }

  getConnectionLayer(): ConnectionLayer {
    return this.connectionLayer;
  }

  /**
   * Обновляет весь мир на основе данных композиторов
   */
  update(composers: ComposerNode[], zoom: number): void {
    this.staveRoadLayer.updateRoads(composers);
    this.composerLayer.updateComposers(composers);
    this.connectionLayer.updateConnections(composers);
    this.eraLayer.updateOpacityByZoom(zoom);
    this.composerLayer.updateLODByZoom(zoom);
  }

  /**
   * Выделяет композитора
   */
  highlightComposer(composerId: string | null): void {
    this.composerLayer.highlightComposer(composerId);
    if (composerId) {
      this.connectionLayer.highlightComposerConnections(composerId,
        // Получаем composers из стеков (временное решение, нужна рефакторинг)
      );
    } else {
      // this.connectionLayer.clearHighlight(composers);
    }
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
