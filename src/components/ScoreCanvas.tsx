import { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { DATABASE, type ComposerNode, type MusicPiece } from '../data/database';
import { VexScore } from './VexScore';
import { FullScreenScore } from './FullScreenScore';
import { StaveRoad } from './StaveRoad';
import { FloatingPieceCard } from './FloatingPieceCard';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useComposers } from '../hooks/useComposers';
import type { Era } from '../hooks/useAudioPlayer';
import { ERA_REGIONS, ERA_DIVIDERS } from '../lib/eraMap';

// ПАРАМЕТРЫ МИРА (как на карте города)
const GRID_X = 900;  // Больше пикселей на единицу X
const GRID_Y = 350;  // Больше пикселей на единицу Y
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
  const [cameraX, setCameraX] = useState(0);
  const [hoveredEra, setHoveredEra] = useState<Era | null>(null);

  const [selectedComposer, setSelectedComposer] = useState<ComposerNode | null>(null);
  const [playingPieceId, setPlayingPieceId] = useState<string | null>(null);
  const [fullScreenPiece, setFullScreenPiece] = useState<{
    piece: MusicPiece;
    composer: string;
    era: Era;
  } | null>(null);

  // Drag-pan состояние
  const [isDragging, setIsDragging] = useState(false);
  const panStartRef = useRef({ scrollLeft: 0, cameraY: 0, mouseX: 0, mouseY: 0 });

  const { playbackState, effect, setEffect, togglePlayPause, stop } = useAudioPlayer();
  const { composers: dbComposers, loading: dbLoading, error: dbError } = useComposers();

  console.log('[ScoreCanvas] Rendering. dbLoading:', dbLoading, 'dbComposers:', dbComposers.length, 'error:', dbError);

  // Используем Supabase если загрузилось, иначе локальную базу
  let rawComposers = dbLoading || dbComposers.length === 0 ? DATABASE : dbComposers;

  // === SMART LAYOUT: распределяем композиторов как на карте города ===
  const ERA_ORDER = ['Baroque', 'Classical', 'Romantic', '20th Century', 'Contemporary'];
  const ERA_Y_CENTER: Record<string, number> = {
    'Baroque': 0.5,
    'Classical': 0.8,
    'Romantic': 1.1,
    '20th Century': 1.4,
    'Contemporary': 1.7,
  };
  const CLUSTER_THRESHOLD = 0.3; // X units: композиторы "одновременны"
  const CLUSTER_SPREAD = 0.6;    // Как широко раскрывать кластер по X (как на карте города)
  const CLUSTER_STEP = 1.2;      // Y шаг между стопками (больше расстояния)

  const smartCityLayout = (composers: ComposerNode[]): ComposerNode[] => {
    const result: ComposerNode[] = [];

    for (const era of ERA_ORDER) {
      const eraComps = composers.filter(c => c.era === era).sort((a, b) => a.x - b.x);
      if (!eraComps.length) continue;
      const baseY = ERA_Y_CENTER[era] ?? 0;

      // Группируем в кластеры по X-близости
      const clusters: ComposerNode[][] = [];
      let current: ComposerNode[] = [eraComps[0]];
      for (let i = 1; i < eraComps.length; i++) {
        if (eraComps[i].x - eraComps[i - 1].x < CLUSTER_THRESHOLD) {
          current.push(eraComps[i]);
        } else {
          clusters.push(current);
          current = [eraComps[i]];
        }
      }
      clusters.push(current);

      // Для каждого кластера: раскрываем по X (город-стиль) и Y
      for (const cluster of clusters) {
        const n = cluster.length;
        const centerX = cluster.reduce((sum, c) => sum + c.x, 0) / n;

        cluster.forEach((c, i) => {
          // Раскрываем по X: например, 3 композитора займут [-0.35, 0, +0.35]
          const xSpread = n === 1 ? 0 : (i - (n - 1) / 2) * CLUSTER_SPREAD;
          const newX = centerX + xSpread;

          // Раскрываем по Y: стопка по вертикали (как районы на карте)
          const ySpread = n === 1 ? 0 : (i - (n - 1) / 2) * CLUSTER_STEP;
          const clampedYOffset = Math.max(-2.0, Math.min(2.0, ySpread));

          result.push({ ...c, x: newX, y: baseY + clampedYOffset });
        });
      }
    }

    // Fallback для композиторов с неизвестной эрой
    const handled = new Set(result.map(c => c.id));
    composers.filter(c => !handled.has(c.id)).forEach(c => result.push(c));
    return result;
  };

  // Применяем smartCityLayout для раскрытия кластеров по X и Y (город-стиль)
  const uniqueYValues = new Set(rawComposers.map(c => c.y.toFixed(2)));
  console.log('[SmartLayout] Unique Y values:', uniqueYValues.size);
  console.log('[SmartLayout] Applying smartCityLayout...');
  rawComposers = smartCityLayout(rawComposers);
  console.log('[SmartLayout] After layout, sample:', rawComposers.slice(0, 5).map(c => `${c.label}: x=${c.x.toFixed(2)}, y=${c.y.toFixed(2)}`).join(' | '));

  // === SMART ROADS: строим сетку дорог (спины по эрам + мосты между ними) ===
  const smartRoadConnect = (composers: ComposerNode[]): ComposerNode[] => {
    // Всегда применяем для композиторов без связей (больше не пропускаем на основе глобального счётчика)
    const sorted = [...composers].sort((a, b) => a.x - b.x);

    return sorted.map((c) => {
      if (c.predecessors.length > 0) return c;

      const preds: string[] = [];

      // 1. Спина эры: найти ближайшего предшественника в одной эре (по X слева)
      const sameEra = sorted.filter(c2 => c2.era === c.era && c2.x < c.x);
      if (sameEra.length > 0) {
        preds.push(sameEra[sameEra.length - 1].id); // самый близкий слева
      }

      // 2. Мост между эрами: если первый в эре, связать с последним композитором предыдущей эры
      const eraIdx = ERA_ORDER.indexOf(c.era);
      if (eraIdx > 0 && sameEra.length === 0) {
        const prevEra = ERA_ORDER[eraIdx - 1];
        const prevEraComps = sorted.filter(c2 => c2.era === prevEra);
        if (prevEraComps.length > 0) {
          preds.push(prevEraComps[prevEraComps.length - 1].id);
        }
      }

      return preds.length > 0 ? { ...c, predecessors: preds } : c;
    });
  };

  // Всегда подключаем авторов без связей, чтобы избежать изолированных узлов
  console.log('[SmartRoads] Applying smartRoadConnect to connect all isolated composers...');
  rawComposers = smartRoadConnect(rawComposers);
  const totalPredecessors = rawComposers.reduce((s, c) => s + c.predecessors.length, 0);
  console.log('[SmartRoads] After roads:', totalPredecessors, 'connections for', rawComposers.length, 'composers');

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
    const screenCenterOffset = (window.innerHeight / 2 - HORIZON_Y) / zoom;
    setCameraY(screenCenterOffset - composer.y * GRID_Y);
  };

  // === СЛЕДЯЩАЯ КАМЕРА ===
  const handleScroll = () => {
    if (!scrollRef.current || isDragging) return; // Не обновляем камеру во время драга

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
    const screenCenterOffset = (window.innerHeight / 2 - HORIZON_Y) / zoom;
    setCameraY(screenCenterOffset - targetY * GRID_Y);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [zoom, rawComposers.length, selectedComposer]); // Пересчитываем при выборе композитора

  // Управление стрелочными клавишами
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 50; // px за нажатие
      const zoomStep = 0.05;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (scrollRef.current) scrollRef.current.scrollLeft -= step;
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (scrollRef.current) scrollRef.current.scrollLeft += step;
          break;
        case 'ArrowUp':
          e.preventDefault();
          setCameraY((y) => y - step / zoom);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setCameraY((y) => y + step / zoom);
          break;
        case '+':
        case '=':
          e.preventDefault();
          setZoom((z) => Math.min(1.0, z + zoomStep));
          break;
        case '-':
          e.preventDefault();
          setZoom((z) => Math.max(0.3, z - zoomStep));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom]);

  // suppress unused warning for useLayoutEffect (kept for future DOM measurements)
  void useLayoutEffect;

  const getNodePos = (node: ComposerNode) => ({
    x: node.x * GRID_X + 200,
    y: HORIZON_Y + node.y * GRID_Y,
  });

  // Вычисляем диапазон X и динамическую ширину
  const sortedByX = [...rawComposers].sort((a, b) => a.x - b.x);
  const minX = sortedByX.length > 0 ? sortedByX[0].x : 0;
  const maxX = sortedByX.length > 0 ? sortedByX[sortedByX.length - 1].x : 0;
  const edgeMargin = 400; // px на каждый край
  const canvasWidth = Math.max(
    window.innerWidth,
    (maxX - minX) * GRID_X + 200 + 200 + edgeMargin * 2
  );

  // === ОТРИСОВКА ФОНОВЫХ РЕГИОНОВ ЭПО́Х ===
  const renderEraBackgrounds = () => {
    return Object.values(ERA_REGIONS).map((era) => {
      const x1 = era.bounds.x1 * GRID_X + 200;
      const x2 = era.bounds.x2 * GRID_X + 200;
      const y1 = HORIZON_Y + era.bounds.y1 * GRID_Y;
      const y2 = HORIZON_Y + era.bounds.y2 * GRID_Y;
      const width = x2 - x1;
      const height = y2 - y1;

      return (
        <g key={`era-bg-${era.name}`}>
          {/* Цветная область эпохи */}
          <rect
            x={x1}
            y={y1}
            width={width}
            height={height}
            fill={era.color}
            opacity={hoveredEra === era.name ? era.opacityBg + 0.05 : era.opacityBg}
            stroke={hoveredEra === era.name ? era.accentColor : 'none'}
            strokeWidth={hoveredEra === era.name ? 2 : 0}
            style={{ transition: 'opacity 0.2s ease' }}
          />
        </g>
      );
    });
  };

  // === ОТРИСОВКА РАЗДЕЛИТЕЛЕЙ МЕЖДУ ЭПОХАМИ ===
  const renderEraDividers = () => {
    return ERA_DIVIDERS.map((divider) => {
      const x = divider.x * GRID_X + 200;
      const y1 = HORIZON_Y - 250 * GRID_Y;
      const y2 = HORIZON_Y + 250 * GRID_Y;

      return (
        <g key={`divider-${divider.x}`}>
          {/* Штриховая линия */}
          <line
            x1={x}
            y1={y1}
            x2={x}
            y2={y2}
            stroke="#ccc"
            strokeWidth={1}
            strokeDasharray="5,5"
            opacity={0.5}
          />
          {/* Год */}
          <text
            x={x}
            y={HORIZON_Y + 20}
            textAnchor="middle"
            fontSize="11"
            fill="#999"
            fontWeight="bold"
          >
            {divider.label}
          </text>
        </g>
      );
    });
  };

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
      {/* CSS анимация для контекстных подсказок */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, calc(-50% - 10px)); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
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
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0 }}>🗺️ HISTORICAL MAP</h1>
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
        style={{ width: '100%', height: '100%', overflowX: 'auto', overflowY: 'hidden', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={(e) => {
          setIsDragging(true);
          panStartRef.current = {
            scrollLeft: scrollRef.current?.scrollLeft ?? 0,
            cameraY: cameraY,
            mouseX: e.clientX,
            mouseY: e.clientY,
          };
        }}
        onMouseMove={(e) => {
          if (!isDragging) return;
          const dx = e.clientX - panStartRef.current.mouseX;
          const dy = e.clientY - panStartRef.current.mouseY;
          if (scrollRef.current) {
            scrollRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
          }
          setCameraY(panStartRef.current.cameraY + dy / zoom);
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <div style={{
          width: `${canvasWidth}px`,
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
            {/* СЛОЙ 1: Фоновые регионы эпох */}
            {renderEraBackgrounds()}

            {/* СЛОЙ 2: Разделители между эпохами и годы */}
            {renderEraDividers()}

            {/* СЛОЙ 3: Дороги между композиторами */}
            {renderRoads()}
          </svg>

          {/* СЛОЙ: Интерактивные области эпох (для наведения и контекста) */}
          {Object.values(ERA_REGIONS).map((era) => {
            const x1 = era.bounds.x1 * GRID_X + 200;
            const x2 = era.bounds.x2 * GRID_X + 200;
            const y1 = HORIZON_Y + era.bounds.y1 * GRID_Y;
            const y2 = HORIZON_Y + era.bounds.y2 * GRID_Y;
            const width = x2 - x1;
            const height = y2 - y1;

            return (
              <div
                key={`era-interactive-${era.name}`}
                onMouseEnter={() => setHoveredEra(era.name)}
                onMouseLeave={() => setHoveredEra(null)}
                style={{
                  position: 'absolute',
                  left: x1,
                  top: y1,
                  width: width,
                  height: height,
                  cursor: 'pointer',
                  zIndex: 5,
                }}
              >
                {/* Небольшой отступ для показа контекста */}
                {hoveredEra === era.name && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(0, 0, 0, 0.75)',
                      color: '#fff',
                      padding: '12px 20px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      zIndex: 101,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      animation: 'fadeIn 0.2s ease',
                    }}
                  >
                    {era.historicalContext}
                  </div>
                )}
              </div>
            );
          })}

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
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '800px', height: '800px',
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
