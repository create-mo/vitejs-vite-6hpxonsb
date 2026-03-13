import { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { DATABASE, type ComposerNode, type MusicPiece } from '../data/database';
import { VexScore } from './VexScore';
import { FullScreenScore } from './FullScreenScore';
import { StaveRoad } from './StaveRoad';
import { FloatingPieceCard } from './FloatingPieceCard';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useComposers } from '../hooks/useComposers';
import type { Era } from '../hooks/useAudioPlayer';

// ПАРАМЕТРЫ МИРА
const GRID_X = 600;
const GRID_Y = 250;
const WORLD_HEIGHT = 2000;
const HORIZON_Y = WORLD_HEIGHT / 2;

const AsyncImage = ({ src, alt }: { src: string; alt: string }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ width: '100%', height: '100%', background: '#eee', position: 'relative' }}>
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
          fontSize: '10px', color: '#999',
        }}>
          ...
        </div>
      )}
    </div>
  );
};

export const ScoreCanvas = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.6);
  const [cameraY, setCameraY] = useState(0);

  const [selectedComposer, setSelectedComposer] = useState<ComposerNode | null>(null);
  const [playingPieceId, setPlayingPieceId] = useState<string | null>(null);
  const [fullScreenPiece, setFullScreenPiece] = useState<{
    piece: MusicPiece;
    composer: string;
    era: Era;
  } | null>(null);

  const { playbackState, effect, setEffect, togglePlayPause, stop } = useAudioPlayer();
  const { composers: dbComposers, loading: dbLoading, error: dbError } = useComposers();

  console.log('[ScoreCanvas] Rendering. dbLoading:', dbLoading, 'dbComposers:', dbComposers.length, 'error:', dbError);

  // Используем Supabase если загрузилось, иначе локальную базу
  const rawComposers = dbLoading || dbComposers.length === 0 ? DATABASE : dbComposers;

  // Анализируем позиции композиторов для отладки перекрытий
  useEffect(() => {
    if (rawComposers.length > 0) {
      const sorted = [...rawComposers].sort((a, b) => a.x - b.x);
      console.log('[ScoreCanvas] Composer positions:');
      sorted.forEach(c => {
        console.log(`  ${c.label}: x=${c.x.toFixed(2)}, y=${c.y.toFixed(2)}, screenX=${(c.x * GRID_X + 200).toFixed(0)}, screenY=${(HORIZON_Y + c.y * GRID_Y).toFixed(0)}`);
      });

      // Проверяем перекрытия (минимальное расстояние между окружностями — 70px + margin)
      const MIN_DISTANCE = 100; // px (70 диаметр + зазор)
      const overlaps: string[] = [];
      for (let i = 0; i < sorted.length - 1; i++) {
        const c1 = sorted[i];
        const c2 = sorted[i + 1];
        const screenX1 = c1.x * GRID_X + 200;
        const screenY1 = HORIZON_Y + c1.y * GRID_Y;
        const screenX2 = c2.x * GRID_X + 200;
        const screenY2 = HORIZON_Y + c2.y * GRID_Y;
        const dist = Math.sqrt((screenX2 - screenX1) ** 2 + (screenY2 - screenY1) ** 2);
        if (dist < MIN_DISTANCE) {
          overlaps.push(`⚠️ ${c1.label} & ${c2.label}: ${dist.toFixed(0)}px (min: ${MIN_DISTANCE}px)`);
        }
      }
      if (overlaps.length > 0) {
        console.warn('[ScoreCanvas] OVERLAPS DETECTED:');
        overlaps.forEach(o => console.warn(`  ${o}`));
      } else {
        console.log('[ScoreCanvas] ✓ No overlaps detected');
      }
    }
  }, [rawComposers]);

  // Центрируем камеру на конкретном композиторе
  const centerOnComposer = (composer: ComposerNode) => {
    const screenY = HORIZON_Y + composer.y * GRID_Y;
    const screenCenterOffset = window.innerHeight / 2 / zoom;
    setCameraY(-(screenY) + screenCenterOffset);
  };

  // === СЛЕДЯЩАЯ КАМЕРА ===
  const handleScroll = () => {
    if (!scrollRef.current) return;

    // Если выбран композитор, центрируем на нём
    if (selectedComposer) {
      centerOnComposer(selectedComposer);
      return;
    }

    const scrollLeft = scrollRef.current.scrollLeft;
    const viewportCenter = scrollLeft + window.innerWidth / 2;
    const mapX = (viewportCenter - 200) / (GRID_X * zoom);
    const sortedNodes = [...rawComposers].sort((a, b) => a.x - b.x);

    let leftNode = sortedNodes[0];
    let rightNode = sortedNodes[sortedNodes.length - 1];
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      if (sortedNodes[i].x <= mapX && sortedNodes[i + 1].x > mapX) {
        leftNode = sortedNodes[i];
        rightNode = sortedNodes[i + 1];
        break;
      }
    }

    const t = Math.max(0, Math.min(1, (mapX - leftNode.x) / (rightNode.x - leftNode.x)));
    const targetY = (1 - t) * leftNode.y + t * rightNode.y;
    const screenCenterOffset = window.innerHeight / 2 / zoom;
    setCameraY(-(HORIZON_Y + targetY * GRID_Y) + screenCenterOffset);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [zoom, rawComposers.length, selectedComposer]); // Пересчитываем при выборе композитора

  // suppress unused warning for useLayoutEffect (kept for future DOM measurements)
  void useLayoutEffect;

  const getNodePos = (node: ComposerNode) => ({
    x: node.x * GRID_X + 200,
    y: HORIZON_Y + node.y * GRID_Y,
  });

  const renderRoads = () =>
    rawComposers.map((node) => {
      const start = getNodePos(node);
      return node.predecessors.map((predId) => {
        const pred = rawComposers.find((n) => n.id === predId);
        if (!pred) return null;
        const end = getNodePos(pred);
        return (
          <StaveRoad
            key={`${pred.id}-${node.id}`}
            startX={end.x + 60}
            startY={end.y}
            endX={start.x}
            endY={start.y}
            label={`${pred.era} → ${node.era}`}
          />
        );
      });
    });

  return (
    <div style={{
      height: '100vh',
      background: '#fff',
      color: '#000',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden',
    }}>
      {/* FULL SCREEN MODAL */}
      {fullScreenPiece && (
        <FullScreenScore
          piece={fullScreenPiece.piece}
          composerName={fullScreenPiece.composer}
          onClose={() => setFullScreenPiece(null)}
          isPlaying={playbackState === 'playing'}
          onTogglePlay={() => togglePlayPause(fullScreenPiece.piece, fullScreenPiece.era)}
          onStop={stop}
          effect={effect}
          onEffectChange={setEffect}
        />
      )}


      {/* HUD */}
      <div style={{ position: 'fixed', top: 20, left: 30, zIndex: 100, pointerEvents: 'none' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0 }}>TIMELINE</h1>
        {dbLoading && (
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', letterSpacing: '1px' }}>
            загрузка из Supabase...
          </div>
        )}
        {!dbLoading && (
          <div style={{ fontSize: '11px', color: '#bbb', marginTop: '4px' }}>
            {rawComposers.length} композиторов {dbComposers.length > 0 ? '(Supabase)' : '(локально)'}
          </div>
        )}
        <div style={{ fontSize: '10px', color: '#ccc', marginTop: '8px', background: '#f0f0f0', padding: '4px', borderRadius: '3px' }}>
          <div>dbLoading: {String(dbLoading)}</div>
          <div>dbComposers: {dbComposers.length}</div>
          <div>displayed: {rawComposers.length}</div>
          {dbError && (
            <div style={{ color: '#c00', marginTop: '4px', fontWeight: 'bold', fontSize: '9px' }}>
              ERROR: {dbError.substring(0, 100)}
            </div>
          )}
        </div>
      </div>
      <div style={{ position: 'fixed', bottom: 30, right: 30, display: 'flex', gap: '10px', zIndex: 100 }}>
        <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))} style={zoomBtnStyle}>-</button>
        <button onClick={() => setZoom((z) => Math.min(1.0, z + 0.1))} style={zoomBtnStyle}>+</button>
      </div>

      {/* WORLD */}
      <div
        ref={scrollRef}
        style={{ width: '100%', height: '100%', overflowX: 'auto', overflowY: 'hidden', cursor: 'grab' }}
      >
        <div style={{
          width: '10000px',
          height: WORLD_HEIGHT,
          transform: `scale(${zoom}) translateY(${cameraY}px)`,
          transformOrigin: 'center center',
          transition: 'transform 0.1s linear',
          position: 'relative',
        }}>
          <svg style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            pointerEvents: 'none',
          }}>
            {renderRoads()}
          </svg>

          {rawComposers.map((node) => {
            const pos = getNodePos(node);
            const isSelected = selectedComposer?.id === node.id;

            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: pos.x, top: pos.y - 40,
                  zIndex: isSelected ? 100 : 10,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}
              >
                {/* Круг композитора */}
                <div
                  style={{
                    width: '70px', height: '70px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: isSelected ? '3px solid #000' : '1px solid #000',
                    background: '#fff',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? '0 0 20px rgba(0,0,0,0.3)' : 'none',
                  }}
                  onClick={() => {
                    setSelectedComposer(isSelected ? null : node);
                    stop();
                  }}
                >
                  <AsyncImage src={node.image} alt={node.label} />
                </div>

                {/* Имя композитора */}
                <div
                  style={{
                    fontSize: '14px', fontWeight: '600',
                    background: 'rgba(255,255,255,0.8)',
                    padding: '2px 8px',
                  }}
                >
                  {node.label}
                </div>

                {/* FLOATING PIECE CARDS вокруг выбранного композитора */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0, left: 0,
                      width: '400px', height: '400px',
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
      </div>
    </div>
  );
};

const zoomBtnStyle = {
  width: '40px', height: '40px',
  background: '#fff', border: '1px solid #000',
  color: '#000', fontSize: '20px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const minimalBtnStyle = {
  background: 'transparent', border: 'none',
  cursor: 'pointer', padding: '5px',
};
const bubbleStyle = {
  border: '1px solid #eee',
  borderRadius: '15px',
  padding: '6px 12px',
  fontSize: '11px',
  cursor: 'pointer',
  whiteSpace: 'nowrap' as const,
  background: 'transparent',
};
