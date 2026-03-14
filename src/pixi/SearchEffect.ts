import * as PIXI from 'pixi.js';

/**
 * Управляет визуальным эффектом десатурации при активном поиске.
 * Использует PIXI.ColorMatrixFilter для плавного перехода к черно-белому.
 */
export class SearchEffect {
  private colorMatrix: PIXI.ColorMatrixFilter;
  private isActive: boolean = false;
  private targetSaturation: number = 1;
  private currentSaturation: number = 1;
  private animationDuration: number = 300; // ms
  private animationStart: number = 0;
  private callback?: (filter: PIXI.ColorMatrixFilter) => void;

  constructor() {
    this.colorMatrix = new PIXI.ColorMatrixFilter();
    this.updateSaturation(1);
  }

  /**
   * Получить фильтр для применения к stage
   */
  getFilter(): PIXI.ColorMatrixFilter {
    return this.colorMatrix;
  }

  /**
   * Активировать эффект десатурации (вход в поиск)
   */
  activate(): void {
    if (this.isActive) return;
    this.isActive = true;
    this.targetSaturation = 0; // 0 = черно-белое
    this.animationStart = performance.now();
  }

  /**
   * Деактивировать эффект (выход из поиска)
   */
  deactivate(): void {
    if (!this.isActive) return;
    this.isActive = false;
    this.targetSaturation = 1; // 1 = нормальное
    this.animationStart = performance.now();
  }

  /**
   * Обновить сатурацию (0-1)
   */
  private updateSaturation(value: number): void {
    this.currentSaturation = Math.max(0, Math.min(1, value));
    this.colorMatrix.saturate(this.currentSaturation, false);
  }

  /**
   * Обновить анимацию (вызывать из ticker)
   */
  update(): void {
    const elapsed = performance.now() - this.animationStart;
    const progress = Math.min(1, elapsed / this.animationDuration);

    // Интерполируем между текущей и целевой сатурацией
    const nextSaturation =
      this.currentSaturation + (this.targetSaturation - this.currentSaturation) * progress;

    this.updateSaturation(nextSaturation);

    // Callback если завершилась анимация
    if (progress >= 1 && this.callback) {
      this.callback(this.colorMatrix);
    }
  }

  /**
   * Установить callback при завершении анимации
   */
  onAnimationComplete(callback: (filter: PIXI.ColorMatrixFilter) => void): void {
    this.callback = callback;
  }

  /**
   * Получить текущее состояние
   */
  getIsActive(): boolean {
    return this.isActive;
  }
}
