import * as PIXI from 'pixi.js';

export class PixiAppManager {
  app: PIXI.Application;
  container: HTMLElement | null = null;

  constructor() {
    this.app = new PIXI.Application();
  }

  async init(containerId: string): Promise<void> {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container ${containerId} not found`);
    }

    await this.app.init({
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      backgroundColor: 0x0a0a0a, // Obsidian
      autoDensity: true,
    });

    this.container.appendChild(this.app.canvas);
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  private handleResize(): void {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.app.renderer.resize(width, height);
  }

  getCanvas(): HTMLCanvasElement {
    return this.app.canvas as HTMLCanvasElement;
  }

  getRenderer(): PIXI.Renderer {
    return this.app.renderer;
  }

  getStage(): PIXI.Container {
    return this.app.stage;
  }

  destroy(): void {
    if (this.container && this.app.canvas.parentElement === this.container) {
      this.container.removeChild(this.app.canvas);
    }
    this.app.destroy();
  }
}

// Singleton для удобства
let instance: PixiAppManager | null = null;

export function getPixiApp(): PixiAppManager {
  if (!instance) {
    instance = new PixiAppManager();
  }
  return instance;
}
