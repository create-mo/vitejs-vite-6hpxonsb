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
      backgroundColor: 0x0a0a0a,
      autoDensity: true,
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Растягиваем canvas на весь контейнер через CSS
    const canvas = this.app.canvas as HTMLCanvasElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    this.container.appendChild(canvas);
    this._resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this._resizeHandler);
  }

  private _resizeHandler: (() => void) | null = null;

  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width > 0 && height > 0) {
      this.app.renderer.resize(width, height);
    }
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
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
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
