import { useRef, useState, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { DATABASE, type ComposerNode, type MusicPiece } from '../data/database';
import { FullScreenScore } from './FullScreenScore';
import { FloatingPieceCard } from './FloatingPieceCard';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useComposers } from '../hooks/useComposers';
import { usePixiCamera } from '../hooks/usePixiCamera';
import type { Era } from '../hooks/useAudioPlayer';
import { ERA_REGIONS } from '../lib/eraMap';
import { smartCityLayout, smartRoadConnect, GRID_X, GRID_Y, WORLD_HEIGHT, HORIZON_Y } from '../utils/layout';
import { PixiAppManager } from '../pixi/PixiApp';
import { WorldContainer } from '../pixi/WorldContainer';

const AsyncImage = ({ src, alt }: { src: string; alt: string }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ width: '100%', height: '100%', background: '#1a1a1a', position: 'relative' }}>
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover',
          filter: 'grayscale(100%) contrast(120%) brightness(1.1)',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />
      {!loaded && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '10px', color: '#555',
        }}>
          ...
        </div>
      )}
    </div>
  );
};

export const ScoreCanvas = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PixiAppManager | null>(null);
  const [pixi, setPixi] = useState<PIXI.Application | null>(null);
  const [selectedComposer, setSelectedComposer] = useState<ComposerNode | null>(null);
  const [playingPieceId, setPlayingPieceId] = useState<string | null>(null);
  const [fullScreenPiece, setFullScreenPiece] = useState<{
    piece: MusicPiece;
    composer: string;
    era: Era;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const { playbackState, togglePlayPause, stop } = useAudioPlayer();
  const { composers: dbComposers, loading: dbLoading, error: dbError } = useComposers();

  // Используем Supabase если загрузилось, иначе локальную базу
  let rawComposers = dbLoading || dbComposers.length === 0 ? DATABASE : dbComposers;

  // Применяем layout алгоритмы
  rawComposers = smartCityLayout(rawComposers);
  rawComposers = smartRoadConnect(rawComposers);

  // Инициализация PixiJS
  useEffect(() => {
    if (!canvasContainerRef.current || pixi) return;

    const initPixi = async () => {
      const manager = new PixiAppManager();
      await manager.init('pixi-canvas-container');
      pixiAppRef.current = manager;
      setPixi(manager.app);

      // Добавляем world container
      const world = new WorldContainer();
      manager.getStage().addChild(world);
    };

    initPixi();

    return () => {
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy();
        pixiAppRef.current = null;
      }
    };
  }, [canvasContainerRef, pixi]);

  // Камера
  const camera = usePixiCamera(pixi);

  // Keyboard control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 50;
      const zoomStep = 0.05;

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

  const getNodeScreenPos = (node: ComposerNode): { x: number; y: number } => {
    return {
      x: node.x * GRID_X + 200,
      y: HORIZON_Y + node.y * GRID_Y,
    };
  };

  return (
    <div style={{
      height: '100vh',
      background: '#0a0a0a',
      color: '#e5e5e5',
      fontFamily: 'SF Pro Display, Roboto, sans-serif',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* PixiJS Canvas */}
      <div
        ref={canvasContainerRef}
        id="pixi-canvas-container"
        style={{
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Full Screen Modal */}
      {fullScreenPiece && (
        <FullScreenScore
          piece={fullScreenPiece.piece}
          composerName={fullScreenPiece.composer}
          onClose={() => setFullScreenPiece(null)}
          isPlaying={playbackState === 'playing'}
          onTogglePlay={() => togglePlayPause(fullScreenPiece.piece, fullScreenPiece.era)}
          onStop={stop}
        />
      )}

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

      {/* HTML Overlay for Interactive Elements */}
      {rawComposers.map((node) => {
        const pos = getNodeScreenPos(node);
        const isSelected = selectedComposer?.id === node.id;

        return (
          <div
            key={node.id}
            style={{
              position: 'fixed',
              left: pos.x - 40,
              top: pos.y - 40,
              pointerEvents: 'auto',
            }}
          >
            {/* Composer Circle */}
            <div
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: isSelected ? '3px solid #d4af37' : '1px solid #444',
                background: '#1a1a1a',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isSelected ? '0 0 20px rgba(212, 175, 55, 0.5)' : 'none',
              }}
              onClick={() => {
                setSelectedComposer(isSelected ? null : node);
                stop();
              }}
            >
              <AsyncImage src={node.image} alt={node.label} />
            </div>

            {/* Composer Name */}
            <div
              style={{
                marginTop: '8px',
                fontSize: '12px',
                fontWeight: '600',
                textAlign: 'center',
                color: '#e5e5e5',
                background: 'rgba(10, 10, 10, 0.8)',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              {node.label}
            </div>

            {/* Floating Piece Cards */}
            {isSelected && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '800px',
                  height: '800px',
                  pointerEvents: 'none',
                }}
              >
                {node.pieces.map((piece, idx) => (
                  <div
                    key={piece.id}
                    style={{
                      position: 'absolute',
                      pointerEvents: 'auto',
                    }}
                  >
                    <FloatingPieceCard
                      piece={piece}
                      composerName={node.label}
                      era={node.era as Era}
                      index={idx}
                      total={node.pieces.length}
                      onExpand={() => {
                        setFullScreenPiece({
                          piece,
                          composer: node.label,
                          era: node.era as Era,
                        });
                      }}
                      isPlaying={playingPieceId === piece.id && playbackState === 'playing'}
                      onTogglePlay={() => {
                        setPlayingPieceId(piece.id);
                        togglePlayPause(piece, node.era as Era);
                      }}
                      onStop={stop}
                    />
                  </div>
                ))}
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
