import { useRef, useState, useEffect } from 'react';
import { useComposers, useWorks } from '../hooks/useSupabase';
import type { Composer as SupabaseComposer, Work as SupabaseWork } from '../hooks/useSupabase';
import { VexScore } from './VexScore';
import { FullScreenScore } from './FullScreenScore';
import { StaveRoad } from './StaveRoad';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

// Типы для UI (совместимы со старым интерфейсом)
export interface MusicPiece {
  id: string;
  title: string;
  tempo: number;
  treble: string[];
  bass: string[];
}

export interface ComposerNode {
  id: string;
  label: string;
  era: 'Baroque' | 'Classical' | 'Romantic' | '20th Century' | 'Contemporary';
  lifeDates: string;
  image: string;
  x: number;
  y: number;
  predecessors: string[];
  pieces: MusicPiece[];
}

// Адаптер для преобразования данных Supabase в формат UI
const adaptWorkToMusicPiece = (work: SupabaseWork): MusicPiece => {
  // notes: string[][] - предполагаем, что notes[0] = treble, notes[1] = bass
  // или notes может храниться в другом формате
  let treble: string[] = [];
  let bass: string[] = [];

  if (work.notes && work.notes.length >= 2) {
    // Если notes хранится как [[treble measures], [bass measures]]
    treble = work.notes[0] || [];
    bass = work.notes[1] || [];
  } else if (work.notes && work.notes.length === 1) {
    // Если notes хранится как один массив, попробуем разделить
    treble = work.notes[0] || [];
  }

  return {
    id: work.id,
    title: work.title,
    tempo: work.tempo,
    treble,
    bass,
  };
};

const adaptComposerToNode = (composer: SupabaseComposer, works: SupabaseWork[]): ComposerNode => {
  return {
    id: composer.id,
    label: composer.name,
    era: composer.era,
    lifeDates: composer.life_dates,
    image: composer.image,
    x: composer.x,
    y: composer.y,
    predecessors: composer.predecessors,
    pieces: works.map(adaptWorkToMusicPiece),
  };
};

// ПАРАМЕТРЫ МИРА
const GRID_X = 600;
const GRID_Y = 250;
const WORLD_HEIGHT = 2000;
const HORIZON_Y = WORLD_HEIGHT / 2;

const AsyncImage = ({ src, alt }: { src: string; alt: string }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#eee',
        position: 'relative',
      }}
    >
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'grayscale(100%) contrast(120%) brightness(1.1)',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '10px',
            color: '#999',
          }}
        >
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

  // Загрузка данных из Supabase
  const { data: composers, isLoading: composersLoading, error: composersError } = useComposers();
  const { data: allWorks, isLoading: worksLoading, error: worksError } = useWorks();

  // Агрегируем работы по композиторам
  const nodesMap = new Map<string, ComposerNode>();
  const nodes: ComposerNode[] = [];

  if (composers && allWorks) {
    const worksByComposer = new Map<string, SupabaseWork[]>();
    allWorks.forEach((work) => {
      if (!worksByComposer.has(work.composer_id)) {
        worksByComposer.set(work.composer_id, []);
      }
      worksByComposer.get(work.composer_id)!.push(work);
    });

    composers.forEach((composer) => {
      const composerWorks = worksByComposer.get(composer.id) || [];
      const node = adaptComposerToNode(composer, composerWorks);
      nodesMap.set(node.id, node);
      nodes.push(node);
    });
  }

  // UI State
  const [activeNode, setActiveNode] = useState<ComposerNode | null>(null);
  const [activePieceIndex, setActivePieceIndex] = useState(0);
  const [fullScreenPiece, setFullScreenPiece] = useState<{
    piece: MusicPiece;
    composer: string;
  } | null>(null);

  // Audio Hook
  const { playbackState, togglePlayPause, stopAudio } = useAudioPlayer();

  // Loading state
  if (composersLoading || worksLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>Loading timeline...</div>
          <div style={{ fontSize: '12px', color: '#999' }}>Fetching composers and works from Supabase</div>
        </div>
      </div>
    );
  }

  // Error state
  if (composersError || worksError) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', color: '#c00' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>Error loading data</div>
          <div style={{ fontSize: '12px' }}>
            {(composersError as Error)?.message || (worksError as Error)?.message}
          </div>
        </div>
      </div>
    );
  }

  // === ЛОГИКА СЛЕДЯЩЕЙ КАМЕРЫ ===
  const handleScroll = () => {
    if (!scrollRef.current || nodes.length === 0) return;

    // 1. Где мы сейчас по X (в координатах сетки)
    const scrollLeft = scrollRef.current.scrollLeft;
    const viewportCenter = scrollLeft + window.innerWidth / 2;
    const mapX = (viewportCenter - 200) / (GRID_X * zoom);

    // 2. Ищем соседей (между какими авторами мы находимся)
    // Ноды уже отсортированы по X из Supabase
    let leftNode = nodes[0];
    let rightNode = nodes[nodes.length - 1];

    for (let i = 0; i < nodes.length - 1; i++) {
      if (nodes[i].x <= mapX && nodes[i + 1].x > mapX) {
        leftNode = nodes[i];
        rightNode = nodes[i + 1];
        break;
      }
    }

    // 3. Интерполяция Y
    const t = Math.max(
      0,
      Math.min(1, (mapX - leftNode.x) / (rightNode.x - leftNode.x))
    );

    const targetY = (1 - t) * leftNode.y + t * rightNode.y;

    setCameraY(-targetY * GRID_Y);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [zoom, nodes]);

  const getNodePos = (node: ComposerNode) => ({
    x: node.x * GRID_X + 200,
    y: HORIZON_Y + node.y * GRID_Y,
  });

  const renderRoads = () => {
    return nodes.map((node) => {
      const start = getNodePos(node);
      return node.predecessors.map((predId) => {
        const pred = nodesMap.get(predId);
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
  };

  return (
    <div
      style={{
        height: '100vh',
        background: '#fff',
        color: '#000',
        fontFamily: 'Inter, sans-serif',
        overflow: 'hidden',
      }}
    >
      {fullScreenPiece && (
        <FullScreenScore
          piece={fullScreenPiece.piece}
          composerName={fullScreenPiece.composer}
          onClose={() => setFullScreenPiece(null)}
          isPlaying={playbackState === 'playing'}
          onTogglePlay={() => togglePlayPause(fullScreenPiece.piece)}
          onStop={stopAudio}
        />
      )}

      {activeNode && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(255,255,255,0.7)',
              zIndex: 190,
              backdropFilter: 'blur(5px)',
            }}
            onClick={() => {
              setActiveNode(null);
              stopAudio();
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(500px, 90vw)',
              background: '#fff',
              border: '1px solid #000',
              boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
              zIndex: 200,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
              <div style={{ width: '120px', height: '140px' }}>
                <AsyncImage src={activeNode.image} alt={activeNode.label} />
              </div>
              <div
                style={{
                  flex: 1,
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                  {activeNode.era}
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    fontFamily: 'serif',
                  }}
                >
                  {activeNode.label}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.5 }}>
                  {activeNode.lifeDates}
                </div>
              </div>
            </div>
            <div
              style={{
                padding: '15px 20px',
                background: '#fafafa',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  onClick={() =>
                    togglePlayPause(activeNode.pieces[activePieceIndex], activeNode.era)
                  }
                  style={minimalBtnStyle}
                >
                  {playbackState === 'playing' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6zm8 0h4v16h-4z" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" fill="currentColor" />
                    </svg>
                  )}
                </button>
                <button onClick={stopAudio} style={minimalBtnStyle}>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z" fill="currentColor" />
                  </svg>
                </button>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  maxWidth: '200px',
                }}
              >
                {activeNode.pieces.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      stopAudio();
                      setActivePieceIndex(idx);
                    }}
                    style={{
                      ...bubbleStyle,
                      borderColor: activePieceIndex === idx ? '#000' : '#eee',
                      fontWeight: activePieceIndex === idx ? 'bold' : 'normal',
                    }}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
            <div
              style={{
                padding: '20px',
                cursor: 'pointer',
                textAlign: 'center',
              }}
              onClick={() => {
                stopAudio();
                setFullScreenPiece({
                  piece: activeNode.pieces[activePieceIndex],
                  composer: activeNode.label,
                });
              }}
            >
              <VexScore
                treble={activeNode.pieces[activePieceIndex].treble}
                bass={activeNode.pieces[activePieceIndex].bass}
                width={460}
                limit={2}
              />
              <div
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  marginTop: '10px',
                }}
              >
                Click to Expand ↗
              </div>
            </div>
          </div>
        </>
      )}

      <div
        style={{
          position: 'fixed',
          top: 20,
          left: 30,
          zIndex: 100,
          pointerEvents: 'none',
        }}
      >
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0 }}>
          TIMELINE
        </h1>
      </div>
      <div
        style={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          display: 'flex',
          gap: '10px',
          zIndex: 100,
        }}
      >
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
          style={zoomBtnStyle}
        >
          -
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(1.0, z + 0.1))}
          style={zoomBtnStyle}
        >
          +
        </button>
      </div>

      <div
        ref={scrollRef}
        style={{
          width: '100%',
          height: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          cursor: 'grab',
        }}
      >
        <div
          style={{
            width: '10000px',
            height: WORLD_HEIGHT,
            transform: `scale(${zoom}) translateY(${cameraY}px)`,
            transformOrigin: 'center center',
            transition: 'transform 0.1s linear',
            position: 'relative',
          }}
        >
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {renderRoads()}
          </svg>
          {nodes.map((node) => {
            const pos = getNodePos(node);
            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y - 40,
                  zIndex: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
                onClick={() => {
                  setActiveNode(node);
                  setActivePieceIndex(0);
                  stopAudio();
                }}
              >
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '1px solid #000',
                    background: '#fff',
                    marginBottom: '10px',
                    transition: 'transform 0.2s',
                  }}
                >
                  <AsyncImage src={node.image} alt={node.label} />
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    background: 'rgba(255,255,255,0.8)',
                    padding: '2px 8px',
                  }}
                >
                  {node.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const zoomBtnStyle = {
  width: '40px',
  height: '40px',
  background: '#fff',
  border: '1px solid #000',
  color: '#000',
  fontSize: '20px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
const minimalBtnStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '5px',
};
const bubbleStyle = {
  border: '1px solid #eee',
  borderRadius: '15px',
  padding: '6px 12px',
  fontSize: '11px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  background: 'transparent',
};
