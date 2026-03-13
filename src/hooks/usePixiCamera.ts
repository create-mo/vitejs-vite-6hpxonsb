import { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { easeInOutCubic } from '../utils/easing';

export interface CameraState {
  x: number;
  y: number;
  scale: number;
}

export function usePixiCamera(app: PIXI.Application | null) {
  const [camera, setCamera] = useState<CameraState>({ x: 0, y: 0, scale: 0.6 });
  const cameraRef = useRef<CameraState>({ x: 0, y: 0, scale: 0.6 });
  const isAnimatingRef = useRef(false);
  const animationStartRef = useRef<{ startTime: number; duration: number; from: CameraState; to: CameraState } | null>(null);

  // Применить камеру к сцене
  const applyCamera = useCallback((state: CameraState) => {
    if (!app) return;

    const stage = app.stage;
    const renderer = app.renderer;

    // Вычисляем смещение для центрирования viewport
    const screenCenterX = renderer.width / 2;
    const screenCenterY = renderer.height / 2;

    // Применяем scale и позицию
    stage.scale.set(state.scale);
    stage.position.set(
      screenCenterX - state.x * state.scale,
      screenCenterY - state.y * state.scale
    );
  }, [app]);

  // Pan — смещение камеры
  const pan = useCallback((dx: number, dy: number) => {
    if (isAnimatingRef.current) return;

    const newState = {
      ...cameraRef.current,
      x: cameraRef.current.x - dx / cameraRef.current.scale,
      y: cameraRef.current.y - dy / cameraRef.current.scale,
    };

    cameraRef.current = newState;
    setCamera(newState);
    applyCamera(newState);
  }, [applyCamera]);

  // Zoom в точке экрана
  const zoomAt = useCallback((screenX: number, screenY: number, factor: number) => {
    if (isAnimatingRef.current) return;

    const renderer = app?.renderer;
    if (!renderer) return;

    // Вычисляем мировую координату под курсором
    const scale = cameraRef.current.scale;
    const screenCenterX = renderer.width / 2;
    const screenCenterY = renderer.height / 2;

    const worldX = (screenX - screenCenterX) / scale + cameraRef.current.x;
    const worldY = (screenY - screenCenterY) / scale + cameraRef.current.y;

    const newScale = Math.max(0.2, Math.min(1.5, scale * factor));
    const scaleChange = scale / newScale;

    const newState = {
      x: worldX - (worldX - cameraRef.current.x) * scaleChange,
      y: worldY - (worldY - cameraRef.current.y) * scaleChange,
      scale: newScale,
    };

    cameraRef.current = newState;
    setCamera(newState);
    applyCamera(newState);
  }, [app, applyCamera]);

  // Плавный перелёт к объекту (для Search Beam)
  const flyTo = useCallback((worldX: number, worldY: number, duration: number = 800) => {
    if (!app) return;

    isAnimatingRef.current = true;
    animationStartRef.current = {
      startTime: Date.now(),
      duration,
      from: { ...cameraRef.current },
      to: { x: worldX, y: worldY, scale: 1.0 },
    };

    const animate = () => {
      const anim = animationStartRef.current;
      if (!anim) return;

      const elapsed = Date.now() - anim.startTime;
      const progress = Math.min(1, elapsed / anim.duration);
      const eased = easeInOutCubic(progress);

      const newState: CameraState = {
        x: anim.from.x + (anim.to.x - anim.from.x) * eased,
        y: anim.from.y + (anim.to.y - anim.from.y) * eased,
        scale: anim.from.scale + (anim.to.scale - anim.from.scale) * eased,
      };

      cameraRef.current = newState;
      setCamera(newState);
      applyCamera(newState);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isAnimatingRef.current = false;
        animationStartRef.current = null;
        // Haptic feedback
        navigator.vibrate?.([10]);
      }
    };

    requestAnimationFrame(animate);
  }, [app, applyCamera]);

  // Инициализация камеры при монтировании
  useEffect(() => {
    if (app) {
      applyCamera(cameraRef.current);
    }
  }, [app, applyCamera]);

  return {
    camera,
    pan,
    zoomAt,
    flyTo,
    isAnimating: isAnimatingRef.current,
  };
}
