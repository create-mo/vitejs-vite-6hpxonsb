import { useRef, useState, useEffect, useMemo } from 'react';
import * as PIXI from 'pixi.js';
import { DATABASE, type ComposerNode } from '../data/database';
import { AcousticLens } from './AcousticLens';
import { SearchUI } from './SearchUI';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useComposers } from '../hooks/useComposers';
import { usePixiCamera } from '../hooks/usePixiCamera';
import { smartCityLayout, smartRoadConnect, GRID_X, GRID_Y, HORIZON_Y } from '../utils/layout';
import { PixiAppManager } from '../pixi/PixiApp';
import { WorldContainer } from '../pixi/WorldContainer';
import { SearchEffect } from '../pixi/SearchEffect';

const AsyncImage = ({ src, alt }: { src: string; alt: string }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: 'transparent' }}>
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover',
          filter: 'grayscale(100%) contrast(130%) brightness(0.95)',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      />
    </div>
  );
};

// Цвета свечения по эпохам
const ERA_GLOW: Record<string, string> = {
  'Baroque':       '244, 164, 96',
  'Classical':     '135, 206, 235',
  'Romantic':      '212, 105, 95',
  '20th Century':  '169, 169, 169',
  'Contemporary':  '255, 215, 0',
};

// Атмосфера фона по текущей X позиции камеры
function getEraAtCamera(worldX: number): string {
  if (worldX < 4500) return 'Baroque';
  if (worldX < 7200) return 'Classical';
  if (worldX < 10800) return 'Romantic';
  if (worldX < 12800) return '20th Century';
  return 'Contemporary';
}

const ERA_ATMOSPHERE: Record<string, string> = {
  'Baroque':       'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(55,28,5,0.35) 0%, transparent 70%)',
  'Classical':     'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(8,18,42,0.35)  0%, transparent 70%)',
  'Romantic':      'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(50,10,10,0.40) 0%, transparent 70%)',
  '20th Century':  'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(14,14,18,0.30) 0%, transparent 70%)',
  'Contemporary':  'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(28,22,4,0.35)  0%, transparent 70%)',
};

export const ScoreCanvas = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PixiAppManager | null>(null);
  const [pixi, setPixi] = useState<PIXI.Application | null>(null);
  const [selectedComposer, setSelectedComposer] = useState<ComposerNode | null>(null);
  const [playingPieceId, setPlayingPieceId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hoveredComposerId, setHoveredComposerId] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const searchEffectRef = useRef<SearchEffect | null>(null);

  const { playbackState, togglePlayPause, stop } = useAudioPlayer();
  const { composers: dbComposers, loading: dbLoading, error: dbError } = useComposers();

  // Используем Supabase если загрузилось, иначе локальную базу
  const rawComposers = useMemo(() => {
    const base = dbLoading || dbComposers.length === 0 ? DATABASE : dbComposers;
    return smartRoadConnect(smartCityLayout(base));
  }, [dbLoading, dbComposers]);

  const worldContainerRef = useRef<WorldContainer | null>(null);

  // Инициализация PixiJS
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const initPixi = async () => {
      const manager = new PixiAppManager();
      await manager.init('pixi-canvas-container');
      pixiAppRef.current = manager;

      // Добавляем world container ДО setPixi, чтобы update effect видел его
      const world = new WorldContainer();
      worldContainerRef.current = world;
      manager.getStage().addChild(world);

      // Инициализируем SearchEffect
      const searchEffect = new SearchEffect();
      searchEffectRef.current = searchEffect;
      manager.getStage().filters = [searchEffect.getFilter()];

      manager.app.ticker.add(() => {
        searchEffect.update();
      });

      // setPixi в самом конце — триггерит update effect когда всё готово
      setPixi(manager.app);
    };

    initPixi();

    return () => {
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy();
        pixiAppRef.current = null;
        worldContainerRef.current = null;
        searchEffectRef.current = null;
        setPixi(null);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Камера
  const camera = usePixiCamera(pixi);

  // Обновляем рендер при изменении данных, zoom или инициализации PixiJS
  useEffect(() => {
    if (!worldContainerRef.current || rawComposers.length === 0) return;
    worldContainerRef.current.update(rawComposers, camera.camera.scale);
  // pixi включён в deps чтобы update запустился после инициализации PixiJS
  }, [rawComposers, camera.camera.scale, pixi]);

  // Keyboard control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 50;
      const zoomStep = 0.05;

      // Ctrl+K или Cmd+K для открытия поиска
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        if (searchEffectRef.current) {
          searchEffectRef.current.activate();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          camera.pan(step, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          camera.pan(-step, 0);
          break;
        case 'ArrowUp':
          e.preventDefault();
          camera.pan(0, step);
          break;
        case 'ArrowDown':
          e.preventDefault();
          camera.pan(0, -step);
          break;
        case '+':
        case '=':
          e.preventDefault();
          camera.zoomAt(window.innerWidth / 2, window.innerHeight / 2, 1 / (1 - zoomStep));
          break;
        case '-':
        case '_':
          e.preventDefault();
          camera.zoomAt(window.innerWidth / 2, window.innerHeight / 2, 1 - zoomStep);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [camera]);

  // Mouse drag pan
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    camera.pan(dx, dy);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for tablets
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    camera.pan(dx, dy);
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const getNodeScreenPos = (node: ComposerNode): { x: number; y: number } => {
    const worldX = node.x * GRID_X + 200;
    const worldY = HORIZON_Y + node.y * GRID_Y;
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    return {
      x: screenCenterX + (worldX - camera.camera.x) * camera.camera.scale,
      y: screenCenterY + (worldY - camera.camera.y) * camera.camera.scale,
    };
  };

  return (
    <div style={{
      height: '100%',
      background: '#0a0a0a',
      color: '#e5e5e5',
      fontFamily: 'SF Pro Display, Roboto, sans-serif',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* PixiJS Canvas — размываем когда открыта Acoustic Lens */}
      <div
        ref={canvasContainerRef}
        id="pixi-canvas-container"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
          filter: selectedComposer ? 'blur(40px) brightness(0.25)' : 'none',
          transition: 'filter 0.6s ease',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Era atmosphere overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          background: ERA_ATMOSPHERE[getEraAtCamera(camera.camera.x)],
          transition: 'background 1.4s ease',
        }}
      />

      {/* Acoustic Lens — полноэкранный режим просмотра произведений */}
      {selectedComposer && (
        <AcousticLens
          composer={selectedComposer}
          onClose={() => {
            setSelectedComposer(null);
            stop();
            if (worldContainerRef.current) {
              worldContainerRef.current.highlightComposer(null);
            }
          }}
          onPlayPiece={(piece, era) => {
            setPlayingPieceId(piece.id);
            togglePlayPause(piece, era);
          }}
          onStop={stop}
          playingPieceId={playingPieceId}
          isPlaying={playbackState === 'playing'}
        />
      )}

      {/* Search UI */}
      <SearchUI
        composers={rawComposers}
        isActive={isSearchOpen}
        onSelect={(composer) => {
          // Летим к композитору
          const targetWorld = WorldContainer.getWorldPos(composer);
          camera.flyTo(targetWorld.x, targetWorld.y, 800);

          // Выделяем композитора
          setSelectedComposer(composer);
          if (worldContainerRef.current) {
            worldContainerRef.current.highlightComposer(composer.id);
          }

          // Закрываем поиск
          setIsSearchOpen(false);
          if (searchEffectRef.current) {
            searchEffectRef.current.deactivate();
          }
        }}
        onClose={() => {
          setIsSearchOpen(false);
          if (searchEffectRef.current) {
            searchEffectRef.current.deactivate();
          }
        }}
      />

      {/* HUD */}
      <div style={{ position: 'fixed', top: 20, left: 30, zIndex: 100, pointerEvents: 'none' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, color: '#e5e5e5' }}>🗺️ MUSICAL HERITAGE</h1>
        {dbLoading && (
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', letterSpacing: '1px' }}>
            Загрузка из Supabase...
          </div>
        )}
        {!dbLoading && (
          <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
            {rawComposers.length} композиторов {dbComposers.length > 0 ? '(Supabase)' : '(локально)'}
          </div>
        )}
        {dbError && (
          <div style={{ fontSize: '10px', color: '#c00', marginTop: '4px', fontWeight: 'bold' }}>
            ERROR: {dbError.substring(0, 100)}
          </div>
        )}
      </div>

      {/* Search Button */}
      <button
        onClick={() => {
          setIsSearchOpen(true);
          if (searchEffectRef.current) {
            searchEffectRef.current.activate();
          }
        }}
        style={{
          position: 'fixed',
          top: 20,
          right: 30,
          padding: '8px 12px',
          backgroundColor: '#1a1a1a',
          border: '1px solid #444',
          color: '#999',
          fontSize: '12px',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 100,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#d4af37';
          e.currentTarget.style.color = '#e5e5e5';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#444';
          e.currentTarget.style.color = '#999';
        }}
      >
        ⌘K Search
      </button>

      {/* Zoom Buttons */}
      <div style={{ position: 'fixed', bottom: 30, right: 30, display: 'flex', gap: '10px', zIndex: 100 }}>
        <button
          onClick={() => camera.zoomAt(window.innerWidth / 2, window.innerHeight / 2, 0.9)}
          style={zoomBtnStyle}
        >
          −
        </button>
        <button
          onClick={() => camera.zoomAt(window.innerWidth / 2, window.innerHeight / 2, 1.1)}
          style={zoomBtnStyle}
        >
          +
        </button>
      </div>

      {/* HTML Overlay — Glassmorphism composer nodes */}
      {rawComposers.map((node) => {
        const pos        = getNodeScreenPos(node);
        const isSelected = selectedComposer?.id === node.id;
        const isHovered  = hoveredComposerId === node.id;
        const circleSize = Math.round(Math.max(22, 68 * camera.camera.scale));
        const half       = circleSize / 2;
        const glow       = ERA_GLOW[node.era] ?? '200,200,200';
        const labelSize  = Math.max(9, Math.round(12 * camera.camera.scale));
        const dateSize   = Math.max(8, Math.round(10 * camera.camera.scale));

        return (
          <div
            key={node.id}
            style={{
              position: 'fixed',
              left: pos.x - half,
              top: pos.y - half,
              pointerEvents: 'auto',
              // Dim others when a composer is hovered (not selected — selection opens Lens)
              opacity: hoveredComposerId && !isHovered ? 0.45 : 1,
              transition: 'opacity 0.3s ease',
            }}
          >
            {/* Glassmorphism portrait */}
            <div
              style={{
                width: `${circleSize}px`,
                height: `${circleSize}px`,
                borderRadius: '50%',
                overflow: 'hidden',
                border: `1px solid rgba(${glow}, ${isHovered ? 0.35 : 0.1})`,
                background: 'rgba(10, 8, 6, 0.25)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                cursor: 'pointer',
                transition: 'all 0.35s ease',
                boxShadow: isSelected
                  ? `0 0 28px rgba(${glow}, 0.65), 0 0 8px rgba(${glow}, 0.3)`
                  : isHovered
                  ? `0 0 20px rgba(${glow}, 0.5), 0 0 5px rgba(${glow}, 0.2)`
                  : `0 0 6px rgba(0,0,0,0.6)`,
                transform: isHovered ? 'scale(1.10)' : 'scale(1)',
              }}
              onClick={() => {
                const newSelected = isSelected ? null : node;
                setSelectedComposer(newSelected);
                if (worldContainerRef.current) {
                  worldContainerRef.current.highlightComposer(newSelected?.id || null);
                }
                stop();
              }}
              onMouseEnter={() => setHoveredComposerId(node.id)}
              onMouseLeave={() => setHoveredComposerId(null)}
            >
              <AsyncImage src={node.image} alt={node.label} />
            </div>

            {/* Парящее имя — без фоновой плашки */}
            <div
              style={{
                marginTop: '9px',
                fontSize: `${labelSize}px`,
                fontWeight: '300',
                fontFamily: 'SF Pro Display, Helvetica Neue, Arial, sans-serif',
                textAlign: 'center',
                color: `rgba(220, 215, 205, ${isHovered ? 0.98 : 0.80})`,
                letterSpacing: '0.10em',
                textShadow: '0 1px 6px rgba(0,0,0,0.8)',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease',
              }}
            >
              {node.label}
            </div>

            {/* Парящие даты — без фоновой плашки */}
            {node.life_dates && (
              <div
                style={{
                  marginTop: '3px',
                  fontSize: `${dateSize}px`,
                  fontWeight: '300',
                  fontFamily: 'SF Pro Display, Helvetica Neue, Arial, sans-serif',
                  textAlign: 'center',
                  color: `rgba(${glow}, ${isHovered ? 0.6 : 0.35})`,
                  letterSpacing: '0.18em',
                  textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.3s ease',
                }}
              >
                {node.life_dates}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const zoomBtnStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  background: '#1a1a1a',
  border: '1px solid #444',
  color: '#e5e5e5',
  fontSize: '18px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '4px',
};
